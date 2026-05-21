"use client";

import { useEffect, useMemo, useState } from "react";

import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { StatCard } from "@/components/ui/stat-card";
import {
  ActionButton,
  CrudFeedback,
  FieldShell,
  inputClassName,
  Modal,
} from "@/features/shared/crud-ui";
import { formatCurrency, formatDate, todayISO } from "@/features/shared/format";
import {
  accountStatusOptions,
  optionLabel,
  paymentMethodOptions,
  priorityOptions,
} from "@/features/shared/options";
import type { FeedbackState } from "@/features/shared/types";
import {
  createAccountPayable,
  deleteAccountPayable,
  listAccountsPayable,
  listAccountSupportData,
  updateAccountPayable,
} from "@/features/accounts-payable/queries";
import {
  accountToFormValues,
  emptyAccountForm,
  type AccountCategory,
  type AccountPayableFormValues,
  type AccountPayableRow,
  type AccountPerson,
} from "@/features/accounts-payable/types";
import { createClient } from "@/lib/supabase/client";

type ModalState =
  | { mode: "create"; account: null }
  | { mode: "edit"; account: AccountPayableRow }
  | null;

export function AccountsPayableCrud() {
  const [accounts, setAccounts] = useState<AccountPayableRow[]>([]);
  const [categories, setCategories] = useState<AccountCategory[]>([]);
  const [people, setPeople] = useState<AccountPerson[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState<ModalState>(null);
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  const filteredAccounts = useMemo(() => {
    const needle = search.trim().toLowerCase();

    return accounts.filter((account) => {
      const matchesSearch =
        !needle ||
        account.title.toLowerCase().includes(needle) ||
        (account.description ?? "").toLowerCase().includes(needle);
      const matchesStatus = statusFilter === "all" || account.status === statusFilter;
      const matchesPriority = priorityFilter === "all" || account.priority === priorityFilter;
      const matchesCategory = categoryFilter === "all" || account.category_id === categoryFilter;
      const matchesStart = !startDate || account.due_date >= startDate;
      const matchesEnd = !endDate || account.due_date <= endDate;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority &&
        matchesCategory &&
        matchesStart &&
        matchesEnd
      );
    });
  }, [accounts, categoryFilter, endDate, priorityFilter, search, startDate, statusFilter]);

  const summary = useMemo(() => {
    const today = todayISO();
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekISO = nextWeek.toISOString().slice(0, 10);

    return accounts.reduce(
      (acc, account) => {
        const amount = Number(account.amount);

        if (account.status === "pending") {
          acc.pending += amount;
        }

        if (account.status === "overdue") {
          acc.overdue += amount;
        }

        if (account.priority === "high" || account.priority === "critical") {
          acc.highPriority += amount;
        }

        if (account.status === "pending" && account.due_date >= today && account.due_date <= nextWeekISO) {
          acc.nextSevenDays += amount;
        }

        return acc;
      },
      { pending: 0, overdue: 0, highPriority: 0, nextSevenDays: 0 },
    );
  }, [accounts]);

  async function loadAccounts() {
    setLoading(true);
    setFeedback(null);

    try {
      const client = createClient();
      const {
        data: { user },
        error: userError,
      } = await client.auth.getUser();

      if (userError || !user) {
        setFeedback({ type: "error", message: "Sessão não encontrada. Entre novamente." });
        return;
      }

      setUserId(user.id);

      const [accountsResult, support] = await Promise.all([
        listAccountsPayable(client),
        listAccountSupportData(client),
      ]);

      if (accountsResult.error) {
        setFeedback({ type: "error", message: accountsResult.error.message });
        return;
      }

      if (support.categories.error) {
        setFeedback({ type: "error", message: support.categories.error.message });
        return;
      }

      if (support.people.error) {
        setFeedback({ type: "error", message: support.people.error.message });
        return;
      }

      setAccounts(accountsResult.data ?? []);
      setCategories(support.categories.data ?? []);
      setPeople(support.people.data ?? []);
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Erro ao carregar contas.",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAccounts();
  }, []);

  async function handleSubmit(values: AccountPayableFormValues) {
    const amount = Number(values.amount);

    if (!values.title.trim()) {
      setFeedback({ type: "error", message: "Informe o título da conta." });
      return;
    }

    if (!values.due_date) {
      setFeedback({ type: "error", message: "Informe a data de vencimento." });
      return;
    }

    if (Number.isNaN(amount) || amount < 0) {
      setFeedback({ type: "error", message: "O valor deve ser maior ou igual a zero." });
      return;
    }

    if (!userId) {
      setFeedback({ type: "error", message: "Sessão não encontrada. Entre novamente." });
      return;
    }

    setSaving(true);
    setFeedback(null);

    try {
      const client = createClient();
      const result =
        modal?.mode === "edit"
          ? await updateAccountPayable(client, modal.account.id, values)
          : await createAccountPayable(client, userId, values);

      if (result.error) {
        setFeedback({ type: "error", message: result.error.message });
        return;
      }

      setFeedback({
        type: "success",
        message: modal?.mode === "edit" ? "Conta atualizada." : "Conta criada.",
      });
      setModal(null);
      await loadAccounts();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(account: AccountPayableRow) {
    if (!window.confirm(`Excluir ${account.title}?`)) {
      return;
    }

    const { error } = await deleteAccountPayable(createClient(), account.id);

    if (error) {
      setFeedback({ type: "error", message: error.message });
      return;
    }

    setFeedback({ type: "success", message: "Conta excluída." });
    await loadAccounts();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Obrigações"
        title="Contas"
        description="Controle contas, dívidas e pagamentos que entram no planejamento mensal."
        action={<ActionButton onClick={() => setModal({ mode: "create", account: null })}>Nova conta</ActionButton>}
      />

      <CrudFeedback feedback={feedback} />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Pendente" value={formatCurrency(summary.pending)} helper="Contas ainda abertas." tone="warning" />
        <StatCard label="Atrasado" value={formatCurrency(summary.overdue)} helper="Obrigações em atraso." tone="danger" />
        <StatCard label="Alta prioridade" value={formatCurrency(summary.highPriority)} helper="Alta ou crítica." tone="danger" />
        <StatCard label="Próximos 7 dias" value={formatCurrency(summary.nextSevenDays)} helper="Vence em breve." tone="info" />
      </section>

      <SectionCard title="Filtros" description="Refine por status, prioridade, vencimento e categoria.">
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar" className={inputClassName} />
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className={inputClassName}>
            <option value="all">Todos status</option>
            {accountStatusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)} className={inputClassName}>
            <option value="all">Todas prioridades</option>
            {priorityOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className={inputClassName}>
            <option value="all">Todas categorias</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
          <input value={startDate} onChange={(event) => setStartDate(event.target.value)} type="date" className={inputClassName} />
          <input value={endDate} onChange={(event) => setEndDate(event.target.value)} type="date" className={inputClassName} />
        </div>
      </SectionCard>

      <SectionCard title="Contas cadastradas">
        {loading ? (
          <p className="text-sm text-ink-600">Carregando contas...</p>
        ) : accounts.length === 0 ? (
          <EmptyState title="Nenhuma conta cadastrada" description="Crie contas para começar a planejar o mês." />
        ) : (
          <AccountsTable
            accounts={filteredAccounts}
            categories={categories}
            people={people}
            onEdit={(account) => setModal({ mode: "edit", account })}
            onDelete={(account) => void handleDelete(account)}
          />
        )}
      </SectionCard>

      {modal ? (
        <AccountModal
          modal={modal}
          categories={categories}
          people={people}
          saving={saving}
          onSubmit={(values) => void handleSubmit(values)}
          onClose={() => setModal(null)}
        />
      ) : null}
    </div>
  );
}

function AccountsTable({
  accounts,
  categories,
  people,
  onEdit,
  onDelete,
}: {
  accounts: AccountPayableRow[];
  categories: AccountCategory[];
  people: AccountPerson[];
  onEdit: (account: AccountPayableRow) => void;
  onDelete: (account: AccountPayableRow) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-ink-950/10 text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-ink-600">
          <tr>
            <th className="px-4 py-3">Vencimento</th>
            <th className="px-4 py-3">Conta</th>
            <th className="px-4 py-3">Valor</th>
            <th className="px-4 py-3">Categoria</th>
            <th className="px-4 py-3">Pessoa</th>
            <th className="px-4 py-3">Prioridade</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-950/10">
          {accounts.map((account) => (
            <tr key={account.id}>
              <td className="px-4 py-3 text-ink-600">{formatDate(account.due_date)}</td>
              <td className="px-4 py-3">
                <p className="font-medium text-ink-950">{account.title}</p>
                <p className="text-xs text-ink-600">{account.description ?? "-"}</p>
              </td>
              <td className="px-4 py-3 font-medium text-ink-950">{formatCurrency(Number(account.amount))}</td>
              <td className="px-4 py-3 text-ink-600">{categories.find((category) => category.id === account.category_id)?.name ?? "-"}</td>
              <td className="px-4 py-3 text-ink-600">{people.find((person) => person.id === account.person_id)?.name ?? "-"}</td>
              <td className="px-4 py-3 text-ink-600">{optionLabel(priorityOptions, account.priority)}</td>
              <td className="px-4 py-3 text-ink-600">{optionLabel(accountStatusOptions, account.status)}</td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  <ActionButton variant="secondary" onClick={() => onEdit(account)}>Editar</ActionButton>
                  <ActionButton variant="danger" onClick={() => onDelete(account)}>Excluir</ActionButton>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AccountModal({
  modal,
  categories,
  people,
  saving,
  onSubmit,
  onClose,
}: {
  modal: ModalState;
  categories: AccountCategory[];
  people: AccountPerson[];
  saving: boolean;
  onSubmit: (values: AccountPayableFormValues) => void;
  onClose: () => void;
}) {
  const [values, setValues] = useState<AccountPayableFormValues>(
    modal?.mode === "edit" ? accountToFormValues(modal.account) : emptyAccountForm,
  );

  return (
    <Modal
      title={modal?.mode === "edit" ? "Editar conta" : "Nova conta"}
      description="Contas e dívidas pertencem ao seu usuário e são protegidas por RLS."
      onClose={onClose}
    >
      <form
        className="grid gap-4 md:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit(values);
        }}
      >
        <FieldShell label="Título">
          <input value={values.title} onChange={(event) => setValues({ ...values, title: event.target.value })} className={inputClassName} required />
        </FieldShell>
        <FieldShell label="Valor">
          <input value={values.amount} onChange={(event) => setValues({ ...values, amount: event.target.value })} type="number" min="0" step="0.01" className={inputClassName} required />
        </FieldShell>
        <FieldShell label="Vencimento">
          <input value={values.due_date} onChange={(event) => setValues({ ...values, due_date: event.target.value })} type="date" className={inputClassName} required />
        </FieldShell>
        <FieldShell label="Categoria">
          <select value={values.category_id} onChange={(event) => setValues({ ...values, category_id: event.target.value })} className={inputClassName}>
            <option value="">Sem categoria</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </FieldShell>
        <FieldShell label="Pessoa">
          <select value={values.person_id} onChange={(event) => setValues({ ...values, person_id: event.target.value })} className={inputClassName}>
            <option value="">Sem pessoa</option>
            {people.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
          </select>
        </FieldShell>
        <FieldShell label="Prioridade">
          <select value={values.priority} onChange={(event) => setValues({ ...values, priority: event.target.value })} className={inputClassName}>
            {priorityOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </FieldShell>
        <FieldShell label="Status">
          <select value={values.status} onChange={(event) => setValues({ ...values, status: event.target.value })} className={inputClassName}>
            {accountStatusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </FieldShell>
        <FieldShell label="Forma planejada">
          <select value={values.payment_method_planned} onChange={(event) => setValues({ ...values, payment_method_planned: event.target.value })} className={inputClassName}>
            {paymentMethodOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </FieldShell>
        <FieldShell label="Pode atrasar?">
          <select value={String(values.can_delay)} onChange={(event) => setValues({ ...values, can_delay: event.target.value === "true" })} className={inputClassName}>
            <option value="false">Não</option>
            <option value="true">Sim</option>
          </select>
        </FieldShell>
        <FieldShell label="Risco de atraso">
          <select value={values.delay_risk} onChange={(event) => setValues({ ...values, delay_risk: event.target.value as AccountPayableFormValues["delay_risk"] })} className={inputClassName}>
            {priorityOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </FieldShell>
        <div className="md:col-span-2">
          <FieldShell label="Descrição">
            <textarea value={values.description} onChange={(event) => setValues({ ...values, description: event.target.value })} className={inputClassName} rows={3} />
          </FieldShell>
        </div>
        <div className="md:col-span-2">
          <FieldShell label="Notas">
            <textarea value={values.notes} onChange={(event) => setValues({ ...values, notes: event.target.value })} className={inputClassName} rows={3} />
          </FieldShell>
        </div>
        <div className="flex justify-end gap-2 md:col-span-2">
          <ActionButton type="button" variant="secondary" onClick={onClose}>Cancelar</ActionButton>
          <ActionButton type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar"}</ActionButton>
        </div>
      </form>
    </Modal>
  );
}
