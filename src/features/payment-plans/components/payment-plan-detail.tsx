"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { StatCard } from "@/components/ui/stat-card";
import { createPaymentPlanItem, deletePaymentPlanItem, listPaymentPlanItems, listPlanSourceData, listSimulationData, updatePaymentPlanItem } from "@/features/payment-plans/queries";
import { calculatePaymentPlanScenario } from "@/features/payment-plans/simulator";
import { emptyPaymentPlanItemForm, paymentPlanItemToFormValues, type PaymentPlanItemFormValues, type PaymentPlanItemRow, type PaymentPlanRow, type PlanSourceData } from "@/features/payment-plans/types";
import { ActionButton, CrudFeedback, FieldShell, inputClassName, Modal } from "@/features/shared/crud-ui";
import { formatCurrency, formatDate } from "@/features/shared/format";
import { optionLabel, paymentDecisionOptions, paymentPlanItemTypeOptions, planItemStatusOptions, priorityOptions } from "@/features/shared/options";
import type { FeedbackState } from "@/features/shared/types";
import { createClient } from "@/lib/supabase/client";
import type { AccountPayable, IncomeSource, Installment, Reimbursement } from "@/lib/supabase/types";

type ModalState = { mode: "create"; item: null } | { mode: "edit"; item: PaymentPlanItemRow } | null;

export function PaymentPlanDetail({ planId }: { planId: string }) {
  const [plan, setPlan] = useState<PaymentPlanRow | null>(null);
  const [items, setItems] = useState<PaymentPlanItemRow[]>([]);
  const [sources, setSources] = useState<PlanSourceData>({ accounts: [], invoices: [], installments: [], reimbursements: [], incomeSources: [] });
  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>([]);
  const [reimbursements, setReimbursements] = useState<Reimbursement[]>([]);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [accounts, setAccounts] = useState<AccountPayable[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState<ModalState>(null);
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  const simulation = useMemo(
    () => calculatePaymentPlanScenario({ items, incomeSources, reimbursements, installments, accounts }),
    [accounts, incomeSources, installments, items, reimbursements],
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    const client = createClient();
    const { data: auth } = await client.auth.getUser();
    if (!auth.user) {
      setFeedback({ type: "error", message: "Sessão não encontrada." });
      setLoading(false);
      return;
    }
    setUserId(auth.user.id);
    const [planResult, itemResult, sourceResult, simulationResult] = await Promise.all([
      client.from("payment_plans").select("*").eq("id", planId).single(),
      listPaymentPlanItems(client, planId),
      listPlanSourceData(client),
      listSimulationData(client),
    ]);
    if (planResult.error) setFeedback({ type: "error", message: planResult.error.message });
    else setPlan(planResult.data);
    if (itemResult.error) setFeedback({ type: "error", message: itemResult.error.message });
    else setItems(itemResult.data ?? []);
    setSources({
      accounts: sourceResult.accounts.data ?? [],
      invoices: sourceResult.invoices.data ?? [],
      installments: sourceResult.installments.data ?? [],
      reimbursements: sourceResult.reimbursements.data ?? [],
      incomeSources: sourceResult.incomeSources.data ?? [],
    });
    setIncomeSources(simulationResult.incomeSources.data ?? []);
    setReimbursements(simulationResult.reimbursements.data ?? []);
    setInstallments(simulationResult.installments.data ?? []);
    setAccounts(simulationResult.accounts.data ?? []);
    setLoading(false);
  }, [planId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleSubmit(values: PaymentPlanItemFormValues) {
    if (!values.description.trim()) {
      setFeedback({ type: "error", message: "Descrição é obrigatória." });
      return;
    }
    if (values.item_type !== "manual" && !values.source_id) {
      setFeedback({ type: "error", message: "Escolha o vínculo do item." });
      return;
    }
    if (Number(values.amount) < 0) {
      setFeedback({ type: "error", message: "Valor não pode ser negativo." });
      return;
    }
    if (!userId) return;
    setSaving(true);
    const client = createClient();
    const result = modal?.mode === "edit" ? await updatePaymentPlanItem(client, modal.item.id, values) : await createPaymentPlanItem(client, userId, planId, values);
    if (result.error) setFeedback({ type: "error", message: result.error.message });
    else {
      setFeedback({ type: "success", message: modal?.mode === "edit" ? "Item atualizado." : "Item adicionado." });
      setModal(null);
      await loadData();
    }
    setSaving(false);
  }

  async function handleDelete(item: PaymentPlanItemRow) {
    if (!window.confirm("Excluir este item do plano?")) return;
    const { error } = await deletePaymentPlanItem(createClient(), item.id);
    if (error) setFeedback({ type: "error", message: error.message });
    else {
      setFeedback({ type: "success", message: "Item excluído." });
      await loadData();
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Simulador determinístico"
        title={plan?.name ?? "Plano de pagamento"}
        description="Escolha decisões para cada item e veja o impacto no caixa, risco e próxima fatura."
        action={<ActionButton onClick={() => setModal({ mode: "create", item: null })}>Adicionar item</ActionButton>}
      />
      <CrudFeedback feedback={feedback} />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Pagar agora" value={formatCurrency(simulation.totalPayNow)} helper="Sai do caixa imediatamente." tone="danger" />
        <StatCard label="Quando cair renda" value={formatCurrency(simulation.totalPayWhenIncomeArrives)} helper="Depende de entrada futura." tone="warning" />
        <StatCard label="No cartão" value={formatCurrency(simulation.totalPayByCreditCard)} helper="Pressiona próxima fatura." tone="warning" />
        <StatCard label="Caixa restante estimado" value={formatCurrency(simulation.estimatedRemainingCash)} helper="Inclui dinheiro vinculado separado abaixo." tone={simulation.estimatedRemainingCash < 0 ? "danger" : "success"} />
        <StatCard label="Risco crítico" value={formatCurrency(simulation.criticalRiskAmount)} helper="Priorize antes de baixo risco." tone="danger" />
        <StatCard label="Reembolsos esperados" value={formatCurrency(simulation.reimbursementsExpected)} helper="Não é renda livre." tone="warning" />
        <StatCard label="Dinheiro de terceiros" value={formatCurrency(simulation.thirdPartyMoneyExpected)} helper="Entrada vinculada." tone="warning" />
        <StatCard label="Próxima fatura" value={formatCurrency(simulation.nextInvoicePressure)} helper="Cartão + parcelas ativas." tone="info" />
      </section>

      <SectionCard title="Leitura do plano" description="Regras simples, sem IA.">
        <div className="space-y-2">
          {simulation.insights.map((insight) => (
            <p key={insight} className="rounded-md border border-ink-950/10 bg-slate-50 px-4 py-3 text-sm text-ink-700">{insight}</p>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Itens do plano">
        {loading ? (
          <p className="text-sm text-ink-600">Carregando plano...</p>
        ) : items.length === 0 ? (
          <EmptyState title="Nenhum item no plano" description="Adicione contas, faturas, parcelas, entradas ou itens manuais para simular decisões." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-ink-950/10 text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-ink-600">
                <tr>
                  <th className="px-4 py-3">Item</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Valor</th>
                  <th className="px-4 py-3">Decisão</th>
                  <th className="px-4 py-3">Risco</th>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-950/10">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 font-medium text-ink-950">{item.description ?? item.title}</td>
                    <td className="px-4 py-3 text-ink-600">{optionLabel(paymentPlanItemTypeOptions, item.item_type)}</td>
                    <td className="px-4 py-3 text-ink-950">{formatCurrency(Number(item.amount))}</td>
                    <td className="px-4 py-3 text-ink-600">{optionLabel(paymentDecisionOptions, item.decision)}</td>
                    <td className="px-4 py-3 text-ink-600">{optionLabel(priorityOptions, item.risk_level)}</td>
                    <td className="px-4 py-3 text-ink-600">{formatDate(item.due_date)}</td>
                    <td className="px-4 py-3"><div className="flex justify-end gap-2"><ActionButton variant="secondary" onClick={() => setModal({ mode: "edit", item })}>Editar</ActionButton><ActionButton variant="danger" onClick={() => void handleDelete(item)}>Excluir</ActionButton></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
      <Link className="text-sm font-semibold text-mint-600 hover:text-mint-700" href="/dashboard/payment-plans">Voltar para planos</Link>
      {modal ? <PaymentPlanItemModal modal={modal} saving={saving} sources={sources} onClose={() => setModal(null)} onSubmit={(values) => void handleSubmit(values)} /> : null}
    </div>
  );
}

function PaymentPlanItemModal({ modal, saving, sources, onClose, onSubmit }: { modal: ModalState; saving: boolean; sources: PlanSourceData; onClose: () => void; onSubmit: (values: PaymentPlanItemFormValues) => void }) {
  const [values, setValues] = useState<PaymentPlanItemFormValues>(modal?.mode === "edit" ? paymentPlanItemToFormValues(modal.item) : emptyPaymentPlanItemForm);
  const sourceOptions = buildSourceOptions(values.item_type, sources);

  function applySource(sourceId: string) {
    const source = sourceOptions.find((option) => option.id === sourceId);
    setValues({
      ...values,
      source_id: sourceId,
      description: source?.label ?? values.description,
      amount: source ? String(source.amount) : values.amount,
      due_date: source?.date ?? values.due_date,
    });
  }

  return (
    <Modal title={modal?.mode === "edit" ? "Editar item" : "Adicionar item"} description="Adicione manualmente ou escolha uma conta, fatura, parcela, entrada ou reembolso." onClose={onClose}>
      <form className="grid gap-4 md:grid-cols-2" onSubmit={(event) => { event.preventDefault(); onSubmit(values); }}>
        <FieldShell label="Tipo"><select className={inputClassName} value={values.item_type} onChange={(event) => setValues({ ...emptyPaymentPlanItemForm, item_type: event.target.value })}>{paymentPlanItemTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></FieldShell>
        <FieldShell label="Vínculo"><select className={inputClassName} disabled={values.item_type === "manual"} value={values.source_id} onChange={(event) => applySource(event.target.value)}><option value="">Selecione</option>{sourceOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select></FieldShell>
        <div className="md:col-span-2"><FieldShell label="Descrição"><input required className={inputClassName} value={values.description} onChange={(event) => setValues({ ...values, description: event.target.value })} /></FieldShell></div>
        <FieldShell label="Valor"><input min="0" step="0.01" type="number" className={inputClassName} value={values.amount} onChange={(event) => setValues({ ...values, amount: event.target.value })} /></FieldShell>
        <FieldShell label="Vencimento"><input type="date" className={inputClassName} value={values.due_date} onChange={(event) => setValues({ ...values, due_date: event.target.value })} /></FieldShell>
        <FieldShell label="Decisão"><select className={inputClassName} value={values.decision} onChange={(event) => setValues({ ...values, decision: event.target.value as PaymentPlanItemFormValues["decision"] })}>{paymentDecisionOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></FieldShell>
        <FieldShell label="Data planejada"><input type="date" className={inputClassName} value={values.planned_payment_date} onChange={(event) => setValues({ ...values, planned_payment_date: event.target.value })} /></FieldShell>
        <FieldShell label="Risco"><select className={inputClassName} value={values.risk_level} onChange={(event) => setValues({ ...values, risk_level: event.target.value as PaymentPlanItemFormValues["risk_level"] })}>{priorityOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></FieldShell>
        <FieldShell label="Status"><select className={inputClassName} value={values.status} onChange={(event) => setValues({ ...values, status: event.target.value })}>{planItemStatusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></FieldShell>
        <div className="md:col-span-2"><FieldShell label="Notas"><textarea rows={3} className={inputClassName} value={values.notes} onChange={(event) => setValues({ ...values, notes: event.target.value })} /></FieldShell></div>
        <div className="flex justify-end gap-2 md:col-span-2"><ActionButton type="button" variant="secondary" onClick={onClose}>Cancelar</ActionButton><ActionButton type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar"}</ActionButton></div>
      </form>
    </Modal>
  );
}

function buildSourceOptions(itemType: string, sources: PlanSourceData) {
  if (itemType === "account_payable") {
    return sources.accounts.map((item) => ({
      id: item.id,
      label: item.installment_id && item.is_generated ? `${item.title} (parcela gerada)` : item.title,
      amount: Number(item.amount),
      date: item.due_date,
    }));
  }
  if (itemType === "credit_card_invoice") return sources.invoices.map((item) => ({ id: item.id, label: `Fatura ${item.reference_month.slice(0, 7)}`, amount: Number(item.total_amount) - Number(item.paid_amount), date: item.due_date }));
  if (itemType === "installment") return sources.installments.map((item) => ({ id: item.id, label: item.description, amount: Number(item.installment_amount), date: item.due_month }));
  if (itemType === "reimbursement") return sources.reimbursements.map((item) => ({ id: item.id, label: item.description ?? "Reembolso", amount: Number(item.expected_amount) - Number(item.received_amount), date: item.expected_date ?? "" }));
  if (itemType === "income_source") return sources.incomeSources.map((item) => ({ id: item.id, label: item.name, amount: Number(item.amount), date: item.expected_date ?? "" }));
  return [];
}
