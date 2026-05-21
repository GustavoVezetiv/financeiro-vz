"use client";

import { useEffect, useMemo, useState } from "react";

import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { StatCard } from "@/components/ui/stat-card";
import {
  createReimbursement,
  deleteReimbursement,
  listReimbursements,
  listReimbursementSupportData,
  updateReimbursement,
} from "@/features/reimbursements/queries";
import {
  emptyReimbursementForm,
  reimbursementToFormValues,
  type ReimbursementAccount,
  type ReimbursementFormValues,
  type ReimbursementIncome,
  type ReimbursementPerson,
  type ReimbursementRow,
  type ReimbursementTransaction,
} from "@/features/reimbursements/types";
import { ActionButton, CrudFeedback, FieldShell, inputClassName, Modal, TextBadge } from "@/features/shared/crud-ui";
import { formatCurrency, formatDate } from "@/features/shared/format";
import { optionLabel, reimbursementStatusOptions } from "@/features/shared/options";
import type { FeedbackState } from "@/features/shared/types";
import { createClient } from "@/lib/supabase/client";

type ModalState = { mode: "create"; reimbursement: null } | { mode: "edit"; reimbursement: ReimbursementRow } | null;

export function ReimbursementsCrud() {
  const [reimbursements, setReimbursements] = useState<ReimbursementRow[]>([]);
  const [people, setPeople] = useState<ReimbursementPerson[]>([]);
  const [transactions, setTransactions] = useState<ReimbursementTransaction[]>([]);
  const [accounts, setAccounts] = useState<ReimbursementAccount[]>([]);
  const [income, setIncome] = useState<ReimbursementIncome[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [personFilter, setPersonFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [linkedFilter, setLinkedFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState<ModalState>(null);
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  const filteredReimbursements = useMemo(() => {
    const needle = search.trim().toLowerCase();

    return reimbursements.filter((reimbursement) => {
      const personName = people.find((person) => person.id === reimbursement.person_id)?.name ?? "";
      const hasTransaction = Boolean(reimbursement.credit_card_transaction_id);

      return (
        (!needle ||
          (reimbursement.description ?? "").toLowerCase().includes(needle) ||
          personName.toLowerCase().includes(needle)) &&
        (personFilter === "all" || reimbursement.person_id === personFilter) &&
        (statusFilter === "all" || reimbursement.status === statusFilter) &&
        (linkedFilter === "all" ||
          (linkedFilter === "linked" && hasTransaction) ||
          (linkedFilter === "manual" && !hasTransaction)) &&
        (!dateFrom || (reimbursement.expected_date ?? "") >= dateFrom) &&
        (!dateTo || (reimbursement.expected_date ?? "") <= dateTo)
      );
    });
  }, [dateFrom, dateTo, linkedFilter, people, personFilter, reimbursements, search, statusFilter]);

  const summary = useMemo(() => {
    const isOpen = (item: ReimbursementRow) => ["expected", "partial", "late"].includes(item.status);
    const totalExpected = reimbursements
      .filter(isOpen)
      .reduce((sum, item) => sum + Number(item.expected_amount), 0);
    const totalReceived = reimbursements.reduce((sum, item) => sum + Number(item.received_amount), 0);
    const lateAmount = reimbursements
      .filter((item) => item.status === "late")
      .reduce((sum, item) => sum + Number(item.expected_amount) - Number(item.received_amount), 0);
    const partialAmount = reimbursements
      .filter((item) => item.status === "partial")
      .reduce((sum, item) => sum + Number(item.expected_amount) - Number(item.received_amount), 0);
    const amountOwed = reimbursements
      .filter(isOpen)
      .reduce((sum, item) => sum + Number(item.expected_amount) - Number(item.received_amount), 0);

    return { totalExpected, totalReceived, lateAmount, partialAmount, amountOwed };
  }, [reimbursements]);

  async function loadData() {
    setLoading(true);
    const client = createClient();
    const { data: auth } = await client.auth.getUser();
    if (!auth.user) {
      setFeedback({ type: "error", message: "Sessão não encontrada." });
      setLoading(false);
      return;
    }

    setUserId(auth.user.id);
    const [reimbursementsResult, support] = await Promise.all([
      listReimbursements(client),
      listReimbursementSupportData(client),
    ]);
    if (reimbursementsResult.error) setFeedback({ type: "error", message: reimbursementsResult.error.message });
    else setReimbursements(reimbursementsResult.data ?? []);
    if (!support.people.error) setPeople(support.people.data ?? []);
    if (!support.transactions.error) setTransactions(support.transactions.data ?? []);
    if (!support.accounts.error) setAccounts(support.accounts.data ?? []);
    if (!support.income.error) setIncome(support.income.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function handleSubmit(values: ReimbursementFormValues) {
    if (!values.person_id || Number(values.expected_amount) < 0 || Number(values.received_amount) < 0) {
      setFeedback({ type: "error", message: "Pessoa é obrigatória e valores não podem ser negativos." });
      return;
    }
    if (!userId) return;

    setSaving(true);
    const client = createClient();
    const result =
      modal?.mode === "edit"
        ? await updateReimbursement(client, modal.reimbursement.id, values)
        : await createReimbursement(client, userId, values);

    if (result.error) setFeedback({ type: "error", message: result.error.message });
    else {
      setFeedback({
        type: "success",
        message: modal?.mode === "edit" ? "Reembolso atualizado." : "Reembolso criado.",
      });
      setModal(null);
      await loadData();
    }
    setSaving(false);
  }

  async function handleDelete(reimbursement: ReimbursementRow) {
    if (!window.confirm("Excluir este reembolso?")) return;
    const { error } = await deleteReimbursement(createClient(), reimbursement.id);
    if (error) setFeedback({ type: "error", message: error.message });
    else {
      setFeedback({ type: "success", message: "Reembolso excluído." });
      await loadData();
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Dinheiro vinculado"
        title="Reembolsos"
        description="Controle o que outras pessoas devem por despesas que você pagou antes."
        action={<ActionButton onClick={() => setModal({ mode: "create", reimbursement: null })}>Novo reembolso</ActionButton>}
      />
      <CrudFeedback feedback={feedback} />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="A receber" value={formatCurrency(summary.totalExpected)} helper="Não é renda livre." tone="warning" />
        <StatCard label="Recebido" value={formatCurrency(summary.totalReceived)} helper="Pix já recebido." tone="success" />
        <StatCard label="Atrasado" value={formatCurrency(summary.lateAmount)} helper="Maior risco de caixa." tone="danger" />
        <StatCard label="Parcial" value={formatCurrency(summary.partialAmount)} helper="Ainda falta receber." tone="warning" />
        <StatCard label="Pessoas devem" value={formatCurrency(summary.amountOwed)} helper="Saldo aberto." tone="info" />
      </section>

      <SectionCard title="Separação importante" description="Reembolso existe para compensar despesa paga antes.">
        <p className="text-sm leading-6 text-ink-600">
          Mesmo quando entra via Pix, esse valor deve ser lido como dinheiro vinculado a uma compra,
          conta ou favor financeiro. Ele não aumenta sua renda real disponível.
        </p>
      </SectionCard>

      <SectionCard title="Filtros">
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <input className={inputClassName} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por descrição ou pessoa" />
          <select className={inputClassName} value={personFilter} onChange={(event) => setPersonFilter(event.target.value)}>
            <option value="all">Todas pessoas</option>
            {people.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
          </select>
          <select className={inputClassName} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">Todos status</option>
            {reimbursementStatusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <select className={inputClassName} value={linkedFilter} onChange={(event) => setLinkedFilter(event.target.value)}>
            <option value="all">Todos vínculos</option>
            <option value="linked">Com lançamento</option>
            <option value="manual">Manual</option>
          </select>
          <input type="date" className={inputClassName} value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
          <input type="date" className={inputClassName} value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
        </div>
      </SectionCard>

      <SectionCard title="Reembolsos cadastrados">
        {loading ? (
          <p className="text-sm text-ink-600">Carregando reembolsos...</p>
        ) : reimbursements.length === 0 ? (
          <EmptyState title="Nenhum reembolso cadastrado" description="Crie reembolsos para separar dinheiro de terceiros da sua renda real." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-ink-950/10 text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-ink-600">
                <tr>
                  <th className="px-4 py-3">Pessoa</th>
                  <th className="px-4 py-3">Descrição</th>
                  <th className="px-4 py-3">Esperado</th>
                  <th className="px-4 py-3">Recebido</th>
                  <th className="px-4 py-3">Data prevista</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Vínculo</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-950/10">
                {filteredReimbursements.map((reimbursement) => (
                  <tr key={reimbursement.id}>
                    <td className="px-4 py-3 font-medium text-ink-950">
                      {people.find((person) => person.id === reimbursement.person_id)?.name ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-ink-600">{reimbursement.description ?? "-"}</td>
                    <td className="px-4 py-3 text-ink-950">{formatCurrency(Number(reimbursement.expected_amount))}</td>
                    <td className="px-4 py-3 text-ink-600">{formatCurrency(Number(reimbursement.received_amount))}</td>
                    <td className="px-4 py-3 text-ink-600">{formatDate(reimbursement.expected_date)}</td>
                    <td className="px-4 py-3 text-ink-600">
                      {optionLabel(reimbursementStatusOptions, reimbursement.status)}
                    </td>
                    <td className="px-4 py-3">
                      <TextBadge tone={reimbursement.credit_card_transaction_id ? "info" : "neutral"}>
                        {reimbursement.credit_card_transaction_id ? "Lançamento" : "Manual"}
                      </TextBadge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <ActionButton variant="secondary" onClick={() => setModal({ mode: "edit", reimbursement })}>Editar</ActionButton>
                        <ActionButton variant="danger" onClick={() => void handleDelete(reimbursement)}>Excluir</ActionButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {modal ? (
        <ReimbursementModal
          accounts={accounts}
          income={income}
          modal={modal}
          people={people}
          saving={saving}
          transactions={transactions}
          onClose={() => setModal(null)}
          onSubmit={(values) => void handleSubmit(values)}
        />
      ) : null}
    </div>
  );
}

function ReimbursementModal({
  accounts,
  income,
  modal,
  people,
  saving,
  transactions,
  onClose,
  onSubmit,
}: {
  accounts: ReimbursementAccount[];
  income: ReimbursementIncome[];
  modal: ModalState;
  people: ReimbursementPerson[];
  saving: boolean;
  transactions: ReimbursementTransaction[];
  onClose: () => void;
  onSubmit: (values: ReimbursementFormValues) => void;
}) {
  const [values, setValues] = useState<ReimbursementFormValues>(
    modal?.mode === "edit" ? reimbursementToFormValues(modal.reimbursement) : emptyReimbursementForm,
  );

  return (
    <Modal title={modal?.mode === "edit" ? "Editar reembolso" : "Novo reembolso"} onClose={onClose}>
      <form
        className="grid gap-4 md:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit(values);
        }}
      >
        <FieldShell label="Pessoa responsável">
          <select required className={inputClassName} value={values.person_id} onChange={(event) => setValues({ ...values, person_id: event.target.value })}>
            <option value="">Selecione</option>
            {people.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
          </select>
        </FieldShell>
        <FieldShell label="Status">
          <select className={inputClassName} value={values.status} onChange={(event) => setValues({ ...values, status: event.target.value })}>
            {reimbursementStatusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </FieldShell>
        <div className="md:col-span-2">
          <FieldShell label="Descrição">
            <input className={inputClassName} value={values.description} onChange={(event) => setValues({ ...values, description: event.target.value })} />
          </FieldShell>
        </div>
        <FieldShell label="Valor esperado">
          <input min="0" step="0.01" type="number" className={inputClassName} value={values.expected_amount} onChange={(event) => setValues({ ...values, expected_amount: event.target.value })} />
        </FieldShell>
        <FieldShell label="Valor recebido">
          <input min="0" step="0.01" type="number" className={inputClassName} value={values.received_amount} onChange={(event) => setValues({ ...values, received_amount: event.target.value })} />
        </FieldShell>
        <FieldShell label="Data prevista">
          <input type="date" className={inputClassName} value={values.expected_date} onChange={(event) => setValues({ ...values, expected_date: event.target.value })} />
        </FieldShell>
        <FieldShell label="Data recebida">
          <input type="date" className={inputClassName} value={values.received_date} onChange={(event) => setValues({ ...values, received_date: event.target.value })} />
        </FieldShell>
        <FieldShell label="Lançamento do cartão">
          <select className={inputClassName} value={values.credit_card_transaction_id} onChange={(event) => setValues({ ...values, credit_card_transaction_id: event.target.value })}>
            <option value="">Sem vínculo</option>
            {transactions.map((transaction) => (
              <option key={transaction.id} value={transaction.id}>
                {transaction.description} - {formatCurrency(Number(transaction.amount))}
              </option>
            ))}
          </select>
        </FieldShell>
        <FieldShell label="Conta vinculada">
          <select className={inputClassName} value={values.account_payable_id} onChange={(event) => setValues({ ...values, account_payable_id: event.target.value })}>
            <option value="">Sem vínculo</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>{account.title}</option>
            ))}
          </select>
        </FieldShell>
        <FieldShell label="Entrada relacionada">
          <select className={inputClassName} value={values.income_source_id} onChange={(event) => setValues({ ...values, income_source_id: event.target.value })}>
            <option value="">Sem vínculo</option>
            {income.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
        </FieldShell>
        <div className="md:col-span-2">
          <FieldShell label="Notas">
            <textarea rows={3} className={inputClassName} value={values.notes} onChange={(event) => setValues({ ...values, notes: event.target.value })} />
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
