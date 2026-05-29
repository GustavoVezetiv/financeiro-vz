"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { ActionButton, CrudFeedback, FieldShell, inputClassName, Modal } from "@/features/shared/crud-ui";
import { formatDate } from "@/features/shared/format";
import { optionLabel, paymentPlanStatusOptions } from "@/features/shared/options";
import type { FeedbackState } from "@/features/shared/types";
import { createPaymentPlan, deletePaymentPlan, listPaymentPlans, markPaymentPlanActive, updatePaymentPlan } from "@/features/payment-plans/queries";
import { emptyPaymentPlanForm, paymentPlanToFormValues, type PaymentPlanFormValues, type PaymentPlanRow } from "@/features/payment-plans/types";
import { createClient } from "@/lib/supabase/client";

type ModalState = { mode: "create"; plan: null } | { mode: "edit"; plan: PaymentPlanRow } | null;

export function PaymentPlansCrud() {
  const [plans, setPlans] = useState<PaymentPlanRow[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState<ModalState>(null);
  const [feedback, setFeedback] = useState<FeedbackState>(null);

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
    const result = await listPaymentPlans(client);
    if (result.error) setFeedback({ type: "error", message: result.error.message });
    else setPlans(result.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function handleSubmit(values: PaymentPlanFormValues) {
    if (!values.name.trim() || !values.reference_month) {
      setFeedback({ type: "error", message: "Nome e mês de referência são obrigatórios." });
      return;
    }
    if (!userId) return;
    setSaving(true);
    const client = createClient();
    const result = modal?.mode === "edit" ? await updatePaymentPlan(client, modal.plan.id, values) : await createPaymentPlan(client, userId, values);
    if (result.error) setFeedback({ type: "error", message: result.error.message });
    else {
      setFeedback({ type: "success", message: modal?.mode === "edit" ? "Plano atualizado." : "Plano criado." });
      setModal(null);
      await loadData();
    }
    setSaving(false);
  }

  async function handleDelete(plan: PaymentPlanRow) {
    if (!window.confirm("Excluir este plano e seus itens?")) return;
    const { error } = await deletePaymentPlan(createClient(), plan.id);
    if (error) setFeedback({ type: "error", message: error.message });
    else {
      setFeedback({ type: "success", message: "Plano excluído." });
      await loadData();
    }
  }

  async function handleActivate(plan: PaymentPlanRow) {
    if (!userId) return;
    const { error } = await markPaymentPlanActive(createClient(), userId, plan.id);
    if (error) setFeedback({ type: "error", message: error.message });
    else {
      setFeedback({ type: "success", message: "Plano marcado como ativo." });
      await loadData();
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Estratégia mensal"
        title="Planos de pagamento"
        description="Crie cenários de decisão para o mês: pagar agora, aguardar, parcelar ou empurrar para o cartão."
        action={<ActionButton onClick={() => setModal({ mode: "create", plan: null })}>Novo plano</ActionButton>}
      />
      <CrudFeedback feedback={feedback} />
      <SectionCard
        title="Simulação, não pagamento automático"
        description="O plano de pagamento organiza decisões do mês. Ele não paga contas, não altera faturas e não cria parcelamentos automaticamente."
      >
        <p className="text-sm leading-6 text-ink-600">
          Use o plano para decidir o que pagar agora, o que aguardar, o que negociar e o que jogar para o cartão.
          Depois execute os pagamentos fora do app e atualize os registros manualmente.
        </p>
      </SectionCard>
      <SectionCard title="Planos cadastrados">
        {loading ? (
          <p className="text-sm text-ink-600">Carregando planos...</p>
        ) : plans.length === 0 ? (
          <EmptyState title="Nenhum plano de pagamento" description="Crie um plano mensal para simular decisões antes de pagar." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-ink-950/10 text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-ink-600">
                <tr>
                  <th className="px-4 py-3">Plano</th>
                  <th className="px-4 py-3">Mês</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-950/10">
                {plans.map((plan) => (
                  <tr key={plan.id}>
                    <td className="px-4 py-3 font-medium text-ink-950">{plan.name}</td>
                    <td className="px-4 py-3 text-ink-600">{formatDate(plan.reference_month)}</td>
                    <td className="px-4 py-3 text-ink-600">{optionLabel(paymentPlanStatusOptions, plan.status)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Link className="rounded-md border border-ink-950/10 px-4 py-2.5 text-sm font-semibold text-ink-950 hover:border-mint-500 hover:text-mint-600" href={`/dashboard/payment-plans/${plan.id}`}>Abrir</Link>
                        {plan.status !== "active" ? <ActionButton variant="secondary" onClick={() => void handleActivate(plan)}>Ativar</ActionButton> : null}
                        <ActionButton variant="secondary" onClick={() => setModal({ mode: "edit", plan })}>Editar</ActionButton>
                        <ActionButton variant="danger" onClick={() => void handleDelete(plan)}>Excluir</ActionButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
      {modal ? <PaymentPlanModal modal={modal} saving={saving} onClose={() => setModal(null)} onSubmit={(values) => void handleSubmit(values)} /> : null}
    </div>
  );
}

function PaymentPlanModal({ modal, saving, onClose, onSubmit }: { modal: ModalState; saving: boolean; onClose: () => void; onSubmit: (values: PaymentPlanFormValues) => void }) {
  const [values, setValues] = useState<PaymentPlanFormValues>(modal?.mode === "edit" ? paymentPlanToFormValues(modal.plan) : emptyPaymentPlanForm);
  return (
    <Modal title={modal?.mode === "edit" ? "Editar plano" : "Novo plano"} onClose={onClose}>
      <form className="grid gap-4 md:grid-cols-2" onSubmit={(event) => { event.preventDefault(); onSubmit(values); }}>
        <FieldShell label="Nome"><input required className={inputClassName} value={values.name} onChange={(event) => setValues({ ...values, name: event.target.value })} /></FieldShell>
        <FieldShell label="Mês"><input required type="month" className={inputClassName} value={values.reference_month} onChange={(event) => setValues({ ...values, reference_month: event.target.value })} /></FieldShell>
        <FieldShell label="Status"><select className={inputClassName} value={values.status} onChange={(event) => setValues({ ...values, status: event.target.value })}>{paymentPlanStatusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></FieldShell>
        <div className="md:col-span-2"><FieldShell label="Descrição"><textarea rows={3} className={inputClassName} value={values.description} onChange={(event) => setValues({ ...values, description: event.target.value })} /></FieldShell></div>
        <div className="md:col-span-2"><FieldShell label="Notas"><textarea rows={3} className={inputClassName} value={values.notes} onChange={(event) => setValues({ ...values, notes: event.target.value })} /></FieldShell></div>
        <div className="flex justify-end gap-2 md:col-span-2"><ActionButton type="button" variant="secondary" onClick={onClose}>Cancelar</ActionButton><ActionButton type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar"}</ActionButton></div>
      </form>
    </Modal>
  );
}
