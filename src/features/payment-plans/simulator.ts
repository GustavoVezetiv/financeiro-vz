import type { AccountPayable, IncomeSource, Installment, PaymentPlanItem, Reimbursement } from "@/lib/supabase/types";

export type SimulationInputs = {
  items: PaymentPlanItem[];
  incomeSources: IncomeSource[];
  reimbursements: Reimbursement[];
  installments: Installment[];
  accounts?: AccountPayable[];
};

export function calculatePaymentPlanScenario({
  items,
  incomeSources,
  reimbursements,
  installments,
  accounts = [],
}: SimulationInputs) {
  const sumByDecision = (decision: string) =>
    items.filter((item) => item.decision === decision).reduce((sum, item) => sum + Number(item.amount), 0);

  const realIncomeExpected = incomeSources
    .filter((item) => item.status === "expected" && item.inflow_kind === "real_income")
    .reduce((sum, item) => sum + Number(item.amount), 0);
  const reimbursementsExpectedFromIncome = incomeSources
    .filter((item) => item.status === "expected" && item.inflow_kind === "reimbursement")
    .reduce((sum, item) => sum + Number(item.amount), 0);
  const reimbursementsExpected = reimbursements
    .filter((item) => ["expected", "partial", "late"].includes(item.status))
    .reduce((sum, item) => sum + Number(item.expected_amount) - Number(item.received_amount), 0);
  const thirdPartyMoneyExpected = incomeSources
    .filter((item) => item.status === "expected" && item.inflow_kind === "third_party_money")
    .reduce((sum, item) => sum + Number(item.amount), 0);

  const totalPayNow = sumByDecision("pay_now");
  const totalPayWhenIncomeArrives = sumByDecision("pay_when_income_arrives");
  const totalPayByCreditCard = sumByDecision("pay_by_card");
  const totalParcel = sumByDecision("parcel");
  const totalWait = sumByDecision("wait");
  const totalNegotiate = sumByDecision("negotiate");
  const totalIgnored = sumByDecision("ignore_for_now");
  const criticalRiskAmount = items
    .filter((item) => item.risk_level === "critical")
    .reduce((sum, item) => sum + Number(item.amount), 0);
  const highRiskAmount = items
    .filter((item) => item.risk_level === "high")
    .reduce((sum, item) => sum + Number(item.amount), 0);

  const generatedInstallmentIds = new Set(
    accounts
      .filter((item) => item.installment_id && item.is_generated && item.source_type === "installment")
      .map((item) => item.installment_id as string),
  );
  const activeInstallmentAmount = installments
    .filter((item) => item.status === "active" && !item.invoice_id && !generatedInstallmentIds.has(item.id))
    .reduce((sum, item) => sum + Number(item.installment_amount), 0);
  const pendingObligations = items
    .filter((item) => !["income_source", "reimbursement"].includes(item.item_type))
    .reduce((sum, item) => sum + Number(item.amount), 0);
  const availableExpectedCash = realIncomeExpected + reimbursementsExpected + reimbursementsExpectedFromIncome + thirdPartyMoneyExpected;
  const plannedCashPayments = totalPayNow + totalPayWhenIncomeArrives;
  const estimatedRemainingCash = availableExpectedCash - plannedCashPayments;
  const nextInvoicePressure = totalPayByCreditCard + activeInstallmentAmount;

  return {
    totalPayNow,
    totalPayWhenIncomeArrives,
    totalPayByCreditCard,
    totalParcel,
    totalWait,
    totalNegotiate,
    totalIgnored,
    criticalRiskAmount,
    highRiskAmount,
    availableExpectedCash,
    realIncomeExpected,
    reimbursementsExpected: reimbursementsExpected + reimbursementsExpectedFromIncome,
    thirdPartyMoneyExpected,
    pendingObligations,
    estimatedRemainingCash,
    nextInvoicePressure,
    activeInstallmentAmount,
    insights: buildInsights({
      criticalRiskAmount,
      totalPayByCreditCard,
      reimbursementsExpected: reimbursementsExpected + reimbursementsExpectedFromIncome,
      estimatedRemainingCash,
    }),
  };
}

function buildInsights({
  criticalRiskAmount,
  totalPayByCreditCard,
  reimbursementsExpected,
  estimatedRemainingCash,
}: {
  criticalRiskAmount: number;
  totalPayByCreditCard: number;
  reimbursementsExpected: number;
  estimatedRemainingCash: number;
}) {
  const insights: string[] = [];
  if (criticalRiskAmount > 0) insights.push("Há itens críticos no plano. Priorize antes de decisões de baixo risco.");
  if (totalPayByCreditCard > 0) insights.push("Parte do alívio de caixa está sendo jogada para a próxima fatura.");
  if (reimbursementsExpected > 0) insights.push("Seu plano depende de reembolsos. Confirme se essas pessoas vão pagar na data prevista.");
  if (estimatedRemainingCash < 0) insights.push("O plano ainda fecha negativo. Revise parcelamentos, aguardos ou entradas incertas.");
  if (insights.length === 0) insights.push("O plano não apresenta alertas fortes pelas regras atuais.");
  return insights;
}
