import type { PaymentPlanFormValues, PaymentPlanItemFormValues, PaymentPlanItemRow, PaymentPlanRow } from "@/features/payment-plans/types";
import type { AppSupabaseClient } from "@/features/shared/types";

export async function listPaymentPlans(client: AppSupabaseClient) {
  return client.from("payment_plans").select("*").order("reference_month", { ascending: false });
}

export async function createPaymentPlan(client: AppSupabaseClient, userId: string, values: PaymentPlanFormValues) {
  return client.from("payment_plans").insert(toPlanPayload(userId, values)).select("*").single();
}

export async function updatePaymentPlan(client: AppSupabaseClient, id: string, values: PaymentPlanFormValues) {
  return client.from("payment_plans").update(toPlanPayload(undefined, values)).eq("id", id).select("*").single();
}

export async function deletePaymentPlan(client: AppSupabaseClient, id: string) {
  return client.from("payment_plans").delete().eq("id", id);
}

export async function markPaymentPlanActive(client: AppSupabaseClient, userId: string, id: string) {
  await client.from("payment_plans").update({ status: "draft" }).eq("user_id", userId).eq("status", "active");
  return client.from("payment_plans").update({ status: "active" }).eq("id", id).select("*").single();
}

export async function listPaymentPlanItems(client: AppSupabaseClient, planId: string) {
  return client.from("payment_plan_items").select("*").eq("payment_plan_id", planId).order("due_date", { ascending: true });
}

export async function createPaymentPlanItem(client: AppSupabaseClient, userId: string, planId: string, values: PaymentPlanItemFormValues) {
  return client.from("payment_plan_items").insert(toItemPayload(userId, planId, values)).select("*").single();
}

export async function updatePaymentPlanItem(client: AppSupabaseClient, id: string, values: PaymentPlanItemFormValues) {
  return client.from("payment_plan_items").update(toItemPayload(undefined, undefined, values)).eq("id", id).select("*").single();
}

export async function deletePaymentPlanItem(client: AppSupabaseClient, id: string) {
  return client.from("payment_plan_items").delete().eq("id", id);
}

export async function listPlanSourceData(client: AppSupabaseClient) {
  const [accounts, invoices, installments, reimbursements, incomeSources] = await Promise.all([
    client.from("accounts_payable").select("id,title,amount,due_date,risk_level,installment_id,is_generated,source_type").in("status", ["pending", "overdue"]),
    client.from("credit_card_invoices").select("id,reference_month,due_date,total_amount,paid_amount").in("status", ["open", "closed", "partial", "overdue"]),
    client.from("installments").select("id,description,installment_amount,due_month,status").eq("status", "active"),
    client.from("reimbursements").select("id,description,expected_amount,received_amount,expected_date,status").in("status", ["expected", "partial", "late"]),
    client.from("income_sources").select("id,name,amount,expected_date,inflow_kind,status").eq("status", "expected"),
  ]);

  const filteredInstallments = { ...installments };

  if (!accounts.error && !installments.error) {
    const generatedInstallmentIds = new Set(
      (accounts.data ?? [])
        .filter((account) => account.installment_id && account.is_generated && account.source_type === "installment")
        .map((account) => account.installment_id),
    );

    filteredInstallments.data = (installments.data ?? []).filter((installment) => !generatedInstallmentIds.has(installment.id));
  }

  return { accounts, invoices, installments: filteredInstallments, reimbursements, incomeSources };
}

export async function listSimulationData(client: AppSupabaseClient) {
  const [incomeSources, reimbursements, installments, accounts] = await Promise.all([
    client.from("income_sources").select("*"),
    client.from("reimbursements").select("*"),
    client.from("installments").select("*"),
    client.from("accounts_payable").select("*"),
  ]);

  return { incomeSources, reimbursements, installments, accounts };
}

function toPlanPayload(userId: string | undefined, values: PaymentPlanFormValues): Partial<PaymentPlanRow> {
  return {
    ...(userId ? { user_id: userId } : {}),
    name: values.name.trim(),
    reference_month: `${values.reference_month}-01`,
    description: values.description.trim() || null,
    status: values.status,
    notes: values.notes.trim() || null,
  };
}

function toItemPayload(userId: string | undefined, planId: string | undefined, values: PaymentPlanItemFormValues): Partial<PaymentPlanItemRow> {
  const linked = values.source_id || null;
  return {
    ...(userId ? { user_id: userId } : {}),
    ...(planId ? { payment_plan_id: planId } : {}),
    item_type: values.item_type,
    source_id: linked,
    account_payable_id: values.item_type === "account_payable" ? linked : null,
    credit_card_invoice_id: values.item_type === "credit_card_invoice" ? linked : null,
    installment_id: values.item_type === "installment" ? linked : null,
    reimbursement_id: values.item_type === "reimbursement" ? linked : null,
    income_source_id: values.item_type === "income_source" ? linked : null,
    title: values.description.trim(),
    description: values.description.trim() || null,
    amount: Number(values.amount || 0),
    due_date: values.due_date || null,
    decision: values.decision,
    planned_payment_date: values.planned_payment_date || null,
    status: values.status,
    priority: values.risk_level === "critical" ? "critical" : values.risk_level === "high" ? "high" : "normal",
    risk_level: values.risk_level,
    notes: values.notes.trim() || null,
  };
}
