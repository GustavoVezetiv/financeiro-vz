import type {
  AccountPayable,
  CreditCardInvoice,
  IncomeSource,
  Installment,
  PaymentDecision,
  PaymentPlan,
  PaymentPlanItem,
  Reimbursement,
  RiskLevel,
} from "@/lib/supabase/types";

export type PaymentPlanRow = PaymentPlan;
export type PaymentPlanItemRow = PaymentPlanItem;

export type PaymentPlanFormValues = {
  name: string;
  reference_month: string;
  description: string;
  status: string;
  notes: string;
};

export type PaymentPlanItemFormValues = {
  item_type: string;
  source_id: string;
  description: string;
  amount: string;
  due_date: string;
  decision: PaymentDecision;
  planned_payment_date: string;
  status: string;
  risk_level: RiskLevel;
  notes: string;
};

export type PlanSourceData = {
  accounts: Pick<AccountPayable, "id" | "title" | "amount" | "due_date" | "risk_level" | "installment_id" | "is_generated" | "source_type">[];
  invoices: Pick<CreditCardInvoice, "id" | "reference_month" | "due_date" | "total_amount" | "paid_amount">[];
  installments: Pick<Installment, "id" | "description" | "installment_amount" | "due_month" | "status">[];
  reimbursements: Pick<Reimbursement, "id" | "description" | "expected_amount" | "received_amount" | "expected_date" | "status">[];
  incomeSources: Pick<IncomeSource, "id" | "name" | "amount" | "expected_date" | "inflow_kind" | "status">[];
};

export const emptyPaymentPlanForm: PaymentPlanFormValues = {
  name: "",
  reference_month: "",
  description: "",
  status: "draft",
  notes: "",
};

export const emptyPaymentPlanItemForm: PaymentPlanItemFormValues = {
  item_type: "manual",
  source_id: "",
  description: "",
  amount: "0",
  due_date: "",
  decision: "pay_now",
  planned_payment_date: "",
  status: "planned",
  risk_level: "medium",
  notes: "",
};

export function paymentPlanToFormValues(plan: PaymentPlanRow): PaymentPlanFormValues {
  return {
    name: plan.name,
    reference_month: plan.reference_month.slice(0, 7),
    description: plan.description ?? "",
    status: plan.status,
    notes: plan.notes ?? "",
  };
}

export function paymentPlanItemToFormValues(item: PaymentPlanItemRow): PaymentPlanItemFormValues {
  const sourceId =
    item.account_payable_id ??
    item.credit_card_invoice_id ??
    item.installment_id ??
    item.reimbursement_id ??
    item.income_source_id ??
    "";

  return {
    item_type: item.item_type,
    source_id: sourceId,
    description: item.description ?? item.title,
    amount: String(item.amount),
    due_date: item.due_date ?? "",
    decision: item.decision,
    planned_payment_date: item.planned_payment_date ?? "",
    status: item.status,
    risk_level: item.risk_level,
    notes: item.notes ?? "",
  };
}
