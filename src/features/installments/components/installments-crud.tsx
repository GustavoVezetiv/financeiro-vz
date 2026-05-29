"use client";

import { useEffect, useMemo, useState } from "react";

import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { StatCard } from "@/components/ui/stat-card";
import {
  createInstallment,
  deleteInstallment,
  listInstallments,
  listInstallmentSupportData,
  updateInstallment,
} from "@/features/installments/queries";
import {
  emptyInstallmentForm,
  installmentToFormValues,
  type InstallmentCard,
  type InstallmentCategory,
  type InstallmentFormValues,
  type InstallmentInvoice,
  type InstallmentPerson,
  type InstallmentRow,
} from "@/features/installments/types";
import { ActionButton, CrudFeedback, FieldShell, inputClassName, Modal } from "@/features/shared/crud-ui";
import { formatCurrency, formatDate } from "@/features/shared/format";
import { installmentStatusOptions, optionLabel } from "@/features/shared/options";
import { PeriodFilter } from "@/features/shared/period-filter";
import { createDefaultPeriodValue, isDateRangeInPeriod } from "@/features/shared/period";
import type { FeedbackState } from "@/features/shared/types";
import { createClient } from "@/lib/supabase/client";

type ModalState = { mode: "create"; installment: null } | { mode: "edit"; installment: InstallmentRow } | null;

export function InstallmentsCrud() {
  const [installments, setInstallments] = useState<InstallmentRow[]>([]);
  const [cards, setCards] = useState<InstallmentCard[]>([]);
  const [invoices, setInvoices] = useState<InstallmentInvoice[]>([]);
  const [categories, setCategories] = useState<InstallmentCategory[]>([]);
  const [people, setPeople] = useState<InstallmentPerson[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [cardFilter, setCardFilter] = useState("all");
  const [period, setPeriod] = useState(createDefaultPeriodValue());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState<ModalState>(null);
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  const periodInstallments = useMemo(() => {
    return installments.filter((item) =>
      isDateRangeInPeriod(item.start_date ?? item.due_month, item.end_date ?? item.due_month, period),
    );
  }, [installments, period]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return periodInstallments.filter(
      (item) =>
        (!needle || item.description.toLowerCase().includes(needle)) &&
        (statusFilter === "all" || item.status === statusFilter) &&
        (cardFilter === "all" || item.credit_card_id === cardFilter),
    );
  }, [cardFilter, periodInstallments, search, statusFilter]);

  const summary = useMemo(() => {
    const active = periodInstallments.filter((item) => item.status === "active");
    const monthlyAmount = active.reduce((sum, item) => sum + Number(item.installment_amount), 0);
    const activeTotal = active.reduce((sum, item) => sum + Number(item.total_amount), 0);
    const finishingSoon = active.filter((item) => {
      const current = Number(item.current_installment ?? item.installment_number);
      const total = Number(item.installment_total ?? item.installment_count);
      return total - current <= 2;
    }).length;
    const futureCommitment = active.reduce((sum, item) => {
      const current = Number(item.current_installment ?? item.installment_number);
      const total = Number(item.installment_total ?? item.installment_count);
      return sum + Math.max(total - current + 1, 0) * Number(item.installment_amount);
    }, 0);
    return { activeTotal, monthlyAmount, finishingSoon, futureCommitment };
  }, [periodInstallments]);

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
    const [installmentsResult, support] = await Promise.all([
      listInstallments(client),
      listInstallmentSupportData(client),
    ]);
    if (installmentsResult.error) setFeedback({ type: "error", message: installmentsResult.error.message });
    else setInstallments(installmentsResult.data ?? []);
    if (!support.cards.error) setCards(support.cards.data ?? []);
    if (!support.invoices.error) setInvoices(support.invoices.data ?? []);
    if (!support.categories.error) setCategories(support.categories.data ?? []);
    if (!support.people.error) setPeople(support.people.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function handleSubmit(values: InstallmentFormValues) {
    if (!values.description.trim() || !values.start_date) {
      setFeedback({ type: "error", message: "Descrição e data inicial são obrigatórias." });
      return;
    }
    if (
      Number(values.total_amount) < 0 ||
      Number(values.installment_amount) < 0 ||
      Number(values.current_installment) > Number(values.installment_total)
    ) {
      setFeedback({ type: "error", message: "Valores e parcelas precisam ser válidos." });
      return;
    }
    if (!userId) {
      setFeedback({ type: "error", message: "Sessão não encontrada. Entre novamente para salvar." });
      return;
    }
    setSaving(true);
    try {
      const client = createClient();
      const result =
        modal?.mode === "edit"
          ? await updateInstallment(client, modal.installment.id, values)
          : await createInstallment(client, userId, values);
      if (result.error) {
        console.error("Erro ao salvar parcelamento:", result.error);
        setFeedback({
          type: "error",
          message: "Não foi possível salvar o parcelamento. Verifique os dados e tente novamente.",
        });
        return;
      }

      setFeedback({ type: "success", message: modal?.mode === "edit" ? "Parcelamento atualizado." : "Parcelamento criado." });
      setModal(null);
      await loadData();
    } catch (error) {
      console.error("Erro inesperado ao salvar parcelamento:", error);
      setFeedback({
        type: "error",
        message: "Ocorreu um erro inesperado ao salvar o parcelamento. Tente novamente.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item: InstallmentRow) {
    if (!window.confirm("Excluir este parcelamento?")) return;
    const { error } = await deleteInstallment(createClient(), item.id);
    if (error) setFeedback({ type: "error", message: error.message });
    else {
      setFeedback({ type: "success", message: "Parcelamento excluído." });
      await loadData();
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Compromissos futuros"
        title="Parcelamentos"
        description="Acompanhe compras parceladas e impactos nas próximas faturas e no fluxo futuro."
        action={<ActionButton onClick={() => setModal({ mode: "create", installment: null })}>Novo parcelamento</ActionButton>}
      />
      <CrudFeedback feedback={feedback} />
      <PeriodFilter value={period} onChange={setPeriod} description="Escolha o período de impacto dos parcelamentos." />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Parcelamentos ativos" value={formatCurrency(summary.activeTotal)} helper="Valor total original dos ativos." tone="info" />
        <StatCard label="Impacto mensal" value={formatCurrency(summary.monthlyAmount)} helper="Pressão recorrente mensal." tone="warning" />
        <StatCard label="Terminando em breve" value={String(summary.finishingSoon)} helper="Faltam até 2 parcelas." tone="success" />
        <StatCard label="Compromisso futuro" value={formatCurrency(summary.futureCommitment)} helper="Valor ainda previsto nas próximas faturas." tone="danger" />
      </section>
      <SectionCard title="Filtros">
        <div className="grid gap-3 md:grid-cols-3">
          <input className={inputClassName} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por descrição" />
          <select className={inputClassName} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">Todos status</option>
            {installmentStatusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <select className={inputClassName} value={cardFilter} onChange={(event) => setCardFilter(event.target.value)}>
            <option value="all">Todos cartões</option>
            {cards.map((card) => <option key={card.id} value={card.id}>{card.name}</option>)}
          </select>
        </div>
      </SectionCard>
      <SectionCard title="Parcelamentos cadastrados">
        {loading ? (
          <p className="text-sm text-ink-600">Carregando parcelamentos...</p>
        ) : installments.length === 0 ? (
          <EmptyState title="Nenhum parcelamento" description="Cadastre parcelamentos para enxergar o impacto futuro antes de assumir novas decisões." />
        ) : filtered.length === 0 ? (
          <EmptyState title="Nenhum parcelamento no período" description="Ajuste o período ou os filtros para ver outros parcelamentos." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-ink-950/10 text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-ink-600">
                <tr>
                  <th className="px-4 py-3">Descrição</th>
                  <th className="px-4 py-3">Cartão</th>
                  <th className="px-4 py-3">Parcela</th>
                  <th className="px-4 py-3">Valor mensal</th>
                  <th className="px-4 py-3">Fim</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-950/10">
                {filtered.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 font-medium text-ink-950">{item.description}</td>
                    <td className="px-4 py-3 text-ink-600">{cards.find((card) => card.id === item.credit_card_id)?.name ?? "-"}</td>
                    <td className="px-4 py-3 text-ink-600">{item.current_installment ?? item.installment_number}/{item.installment_total ?? item.installment_count}</td>
                    <td className="px-4 py-3 text-ink-950">{formatCurrency(Number(item.installment_amount))}</td>
                    <td className="px-4 py-3 text-ink-600">{formatDate(item.end_date ?? item.due_month)}</td>
                    <td className="px-4 py-3 text-ink-600">{optionLabel(installmentStatusOptions, item.status)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <ActionButton variant="secondary" onClick={() => setModal({ mode: "edit", installment: item })}>Editar</ActionButton>
                        <ActionButton variant="danger" onClick={() => void handleDelete(item)}>Excluir</ActionButton>
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
        <InstallmentModal
          cards={cards}
          categories={categories}
          invoices={invoices}
          modal={modal}
          people={people}
          saving={saving}
          onClose={() => setModal(null)}
          onSubmit={(values) => void handleSubmit(values)}
        />
      ) : null}
    </div>
  );
}

function InstallmentModal({
  cards,
  categories,
  invoices,
  modal,
  people,
  saving,
  onClose,
  onSubmit,
}: {
  cards: InstallmentCard[];
  categories: InstallmentCategory[];
  invoices: InstallmentInvoice[];
  modal: ModalState;
  people: InstallmentPerson[];
  saving: boolean;
  onClose: () => void;
  onSubmit: (values: InstallmentFormValues) => void;
}) {
  const [values, setValues] = useState<InstallmentFormValues>(
    modal?.mode === "edit" ? installmentToFormValues(modal.installment) : emptyInstallmentForm,
  );

  return (
    <Modal title={modal?.mode === "edit" ? "Editar parcelamento" : "Novo parcelamento"} onClose={onClose}>
      <form className="grid gap-4 md:grid-cols-2" onSubmit={(event) => { event.preventDefault(); onSubmit(values); }}>
        <div className="md:col-span-2"><FieldShell label="Descrição"><input required className={inputClassName} value={values.description} onChange={(event) => setValues({ ...values, description: event.target.value })} /></FieldShell></div>
        <FieldShell label="Valor total"><input min="0" step="0.01" type="number" className={inputClassName} value={values.total_amount} onChange={(event) => setValues({ ...values, total_amount: event.target.value })} /></FieldShell>
        <FieldShell label="Valor da parcela"><input min="0" step="0.01" type="number" className={inputClassName} value={values.installment_amount} onChange={(event) => setValues({ ...values, installment_amount: event.target.value })} /></FieldShell>
        <FieldShell label="Parcela atual"><input min="1" type="number" className={inputClassName} value={values.current_installment} onChange={(event) => setValues({ ...values, current_installment: event.target.value })} /></FieldShell>
        <FieldShell label="Total de parcelas"><input min="1" type="number" className={inputClassName} value={values.installment_total} onChange={(event) => setValues({ ...values, installment_total: event.target.value })} /></FieldShell>
        <FieldShell label="Início"><input required type="date" className={inputClassName} value={values.start_date} onChange={(event) => setValues({ ...values, start_date: event.target.value })} /></FieldShell>
        <FieldShell label="Fim"><input type="date" className={inputClassName} value={values.end_date} onChange={(event) => setValues({ ...values, end_date: event.target.value })} /></FieldShell>
        <FieldShell label="Cartão"><select className={inputClassName} value={values.credit_card_id} onChange={(event) => setValues({ ...values, credit_card_id: event.target.value })}><option value="">Sem cartão</option>{cards.map((card) => <option key={card.id} value={card.id}>{card.name}</option>)}</select></FieldShell>
        <FieldShell label="Fatura"><select className={inputClassName} value={values.invoice_id} onChange={(event) => setValues({ ...values, invoice_id: event.target.value })}><option value="">Sem fatura</option>{invoices.map((invoice) => <option key={invoice.id} value={invoice.id}>{invoice.reference_month.slice(0, 7)} - {formatDate(invoice.due_date)}</option>)}</select></FieldShell>
        <FieldShell label="Categoria"><select className={inputClassName} value={values.category_id} onChange={(event) => setValues({ ...values, category_id: event.target.value })}><option value="">Sem categoria</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></FieldShell>
        <FieldShell label="Pessoa"><select className={inputClassName} value={values.person_id} onChange={(event) => setValues({ ...values, person_id: event.target.value })}><option value="">Sem pessoa</option>{people.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select></FieldShell>
        <FieldShell label="Status"><select className={inputClassName} value={values.status} onChange={(event) => setValues({ ...values, status: event.target.value })}>{installmentStatusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></FieldShell>
        <div className="md:col-span-2"><FieldShell label="Notas"><textarea rows={3} className={inputClassName} value={values.notes} onChange={(event) => setValues({ ...values, notes: event.target.value })} /></FieldShell></div>
        <div className="flex justify-end gap-2 md:col-span-2"><ActionButton type="button" variant="secondary" onClick={onClose}>Cancelar</ActionButton><ActionButton type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar"}</ActionButton></div>
      </form>
    </Modal>
  );
}
