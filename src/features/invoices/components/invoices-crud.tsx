"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { StatCard } from "@/components/ui/stat-card";
import { ActionButton, CrudFeedback, FieldShell, inputClassName, Modal } from "@/features/shared/crud-ui";
import { formatCurrency, formatDate } from "@/features/shared/format";
import { invoiceStatusOptions, optionLabel } from "@/features/shared/options";
import type { FeedbackState } from "@/features/shared/types";
import { createInvoice, deleteInvoice, listInvoiceCards, listInvoices, updateInvoice } from "@/features/invoices/queries";
import { emptyInvoiceForm, invoiceToFormValues, type InvoiceCard, type InvoiceFormValues, type InvoiceRow } from "@/features/invoices/types";
import type { InvoicePaymentStatus } from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/client";

type ModalState = { mode: "create"; invoice: null } | { mode: "edit"; invoice: InvoiceRow } | null;

export function InvoicesCrud() {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [cards, setCards] = useState<InvoiceCard[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [cardFilter, setCardFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState<ModalState>(null);
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  const filteredInvoices = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return invoices.filter((invoice) => {
      const card = cards.find((item) => item.id === invoice.credit_card_id);
      return (
        (!needle || (card?.name ?? "").toLowerCase().includes(needle) || invoice.reference_month.includes(needle)) &&
        (cardFilter === "all" || invoice.credit_card_id === cardFilter) &&
        (statusFilter === "all" || invoice.status === statusFilter)
      );
    });
  }, [cardFilter, cards, invoices, search, statusFilter]);

  const summary = useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const openTotal = invoices.filter((i) => i.status === "open" || i.status === "closed").reduce((s, i) => s + Number(i.total_amount), 0);
    const overdueTotal = invoices.filter((i) => i.status === "overdue").reduce((s, i) => s + Number(i.total_amount), 0);
    const paidThisMonth = invoices.filter((i) => i.status === "paid" && i.due_date.startsWith(currentMonth)).reduce((s, i) => s + Number(i.paid_amount), 0);
    const nextDue = invoices.filter((i) => i.status !== "paid" && i.status !== "cancelled").sort((a, b) => a.due_date.localeCompare(b.due_date))[0];
    return { openTotal, overdueTotal, paidThisMonth, nextDue };
  }, [invoices]);

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
    const [invoiceResult, cardResult] = await Promise.all([listInvoices(client), listInvoiceCards(client)]);
    if (invoiceResult.error) setFeedback({ type: "error", message: invoiceResult.error.message });
    else setInvoices(invoiceResult.data ?? []);
    if (cardResult.error) setFeedback({ type: "error", message: cardResult.error.message });
    else setCards(cardResult.data ?? []);
    setLoading(false);
  }

  useEffect(() => { void loadData(); }, []);

  async function handleSubmit(values: InvoiceFormValues) {
    if (!values.credit_card_id || !values.reference_month || !values.due_date) {
      setFeedback({ type: "error", message: "Cartão, mês de referência e vencimento são obrigatórios." });
      return;
    }
    if (Number(values.total_amount) < 0 || Number(values.paid_amount) < 0) {
      setFeedback({ type: "error", message: "Valores devem ser maiores ou iguais a zero." });
      return;
    }
    if (!userId) return;
    setSaving(true);
    const client = createClient();
    const result = modal?.mode === "edit" ? await updateInvoice(client, modal.invoice.id, values) : await createInvoice(client, userId, values);
    if (result.error) setFeedback({ type: "error", message: result.error.message });
    else {
      setFeedback({ type: "success", message: modal?.mode === "edit" ? "Fatura atualizada." : "Fatura criada." });
      setModal(null);
      await loadData();
    }
    setSaving(false);
  }

  async function handleDelete(invoice: InvoiceRow) {
    if (!window.confirm("Excluir esta fatura?")) return;
    const { error } = await deleteInvoice(createClient(), invoice.id);
    if (error) setFeedback({ type: "error", message: error.message });
    else {
      setFeedback({ type: "success", message: "Fatura excluída." });
      await loadData();
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Pressão mensal" title="Faturas" description="Controle faturas por cartão e mês." action={<ActionButton onClick={() => setModal({ mode: "create", invoice: null })}>Nova fatura</ActionButton>} />
      <CrudFeedback feedback={feedback} />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Faturas abertas" value={formatCurrency(summary.openTotal)} helper="Abertas ou fechadas." tone="warning" />
        <StatCard label="Faturas atrasadas" value={formatCurrency(summary.overdueTotal)} helper="Maior risco." tone="danger" />
        <StatCard label="Pago no mês" value={formatCurrency(summary.paidThisMonth)} helper="Faturas pagas no mês atual." tone="success" />
        <StatCard label="Próximo vencimento" value={summary.nextDue ? formatDate(summary.nextDue.due_date) : "-"} helper={summary.nextDue ? formatCurrency(Number(summary.nextDue.total_amount)) : "Sem fatura aberta."} tone="info" />
      </section>
      <SectionCard title="Filtros">
        <div className="grid gap-3 md:grid-cols-3">
          <input className={inputClassName} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por cartão ou mês" />
          <select className={inputClassName} value={cardFilter} onChange={(e) => setCardFilter(e.target.value)}><option value="all">Todos cartões</option>{cards.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          <select className={inputClassName} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="all">Todos status</option>{invoiceStatusOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
        </div>
      </SectionCard>
      <SectionCard title="Faturas cadastradas">
        {loading ? <p className="text-sm text-ink-600">Carregando faturas...</p> : invoices.length === 0 ? <EmptyState title="Nenhuma fatura cadastrada" description="Crie faturas para lançar compras e acompanhar o impacto mensal." /> : (
          <div className="overflow-x-auto"><table className="min-w-full divide-y divide-ink-950/10 text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-ink-600"><tr><th className="px-4 py-3">Cartão</th><th className="px-4 py-3">Mês</th><th className="px-4 py-3">Vencimento</th><th className="px-4 py-3">Total</th><th className="px-4 py-3">Pago</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Ações</th></tr></thead><tbody className="divide-y divide-ink-950/10">
            {filteredInvoices.map((invoice) => <tr key={invoice.id}><td className="px-4 py-3 font-medium text-ink-950">{cards.find((c) => c.id === invoice.credit_card_id)?.name ?? "-"}</td><td className="px-4 py-3 text-ink-600">{invoice.reference_month.slice(0, 7)}</td><td className="px-4 py-3 text-ink-600">{formatDate(invoice.due_date)}</td><td className="px-4 py-3 text-ink-950">{formatCurrency(Number(invoice.total_amount))}</td><td className="px-4 py-3 text-ink-600">{formatCurrency(Number(invoice.paid_amount))}</td><td className="px-4 py-3 text-ink-600">{optionLabel(invoiceStatusOptions, invoice.status)}</td><td className="px-4 py-3"><div className="flex justify-end gap-2"><Link className="rounded-md border border-ink-950/10 px-4 py-2.5 text-sm font-semibold text-ink-950 hover:border-mint-500 hover:text-mint-600" href={`/dashboard/invoices/${invoice.id}`}>Lançamentos</Link><ActionButton variant="secondary" onClick={() => setModal({ mode: "edit", invoice })}>Editar</ActionButton><ActionButton variant="danger" onClick={() => void handleDelete(invoice)}>Excluir</ActionButton></div></td></tr>)}
          </tbody></table></div>
        )}
      </SectionCard>
      {modal ? <InvoiceModal modal={modal} cards={cards} saving={saving} onClose={() => setModal(null)} onSubmit={(values) => void handleSubmit(values)} /> : null}
    </div>
  );
}

function InvoiceModal({ modal, cards, saving, onClose, onSubmit }: { modal: ModalState; cards: InvoiceCard[]; saving: boolean; onClose: () => void; onSubmit: (values: InvoiceFormValues) => void; }) {
  const [values, setValues] = useState<InvoiceFormValues>(modal?.mode === "edit" ? invoiceToFormValues(modal.invoice) : emptyInvoiceForm);
  return <Modal title={modal?.mode === "edit" ? "Editar fatura" : "Nova fatura"} onClose={onClose}><form className="grid gap-4 md:grid-cols-2" onSubmit={(e) => { e.preventDefault(); onSubmit(values); }}>
    <FieldShell label="Cartão"><select required className={inputClassName} value={values.credit_card_id} onChange={(e) => setValues({ ...values, credit_card_id: e.target.value })}><option value="">Selecione</option>{cards.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></FieldShell>
    <FieldShell label="Mês de referência"><input required type="month" className={inputClassName} value={values.reference_month.slice(0, 7)} onChange={(e) => setValues({ ...values, reference_month: `${e.target.value}-01` })} /></FieldShell>
    <FieldShell label="Fechamento"><input type="date" className={inputClassName} value={values.closing_date} onChange={(e) => setValues({ ...values, closing_date: e.target.value })} /></FieldShell>
    <FieldShell label="Vencimento"><input required type="date" className={inputClassName} value={values.due_date} onChange={(e) => setValues({ ...values, due_date: e.target.value })} /></FieldShell>
    <FieldShell label="Valor total"><input type="number" min="0" step="0.01" className={inputClassName} value={values.total_amount} onChange={(e) => setValues({ ...values, total_amount: e.target.value })} /></FieldShell>
    <FieldShell label="Valor pago"><input type="number" min="0" step="0.01" className={inputClassName} value={values.paid_amount} onChange={(e) => setValues({ ...values, paid_amount: e.target.value })} /></FieldShell>
    <FieldShell label="Status"><select className={inputClassName} value={values.status} onChange={(e) => setValues({ ...values, status: e.target.value as InvoicePaymentStatus })}>{invoiceStatusOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></FieldShell>
    <div className="md:col-span-2"><FieldShell label="Notas"><textarea rows={3} className={inputClassName} value={values.notes} onChange={(e) => setValues({ ...values, notes: e.target.value })} /></FieldShell></div>
    <div className="flex justify-end gap-2 md:col-span-2"><ActionButton type="button" variant="secondary" onClick={onClose}>Cancelar</ActionButton><ActionButton type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar"}</ActionButton></div>
  </form></Modal>;
}
