import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { StatCard } from "@/components/ui/stat-card";
import { calculatePaymentPlanScenario } from "@/features/payment-plans/simulator";
import { formatCurrency, formatDate, todayISO } from "@/features/shared/format";
import { createClient } from "@/lib/supabase/server";
import type {
  AccountPayable,
  CreditCardInvoice,
  CreditCardTransaction,
  IncomeSource,
  Installment,
  PaymentPlan,
  PaymentPlanItem,
  Reimbursement,
} from "@/lib/supabase/types";

export const metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const supabase = await createClient();

  if (!supabase) {
    return <DashboardError message="Supabase não está configurado." />;
  }

  const [
    accountsResult,
    incomeResult,
    invoicesResult,
    transactionsResult,
    reimbursementsResult,
    installmentsResult,
    activePlanResult,
  ] =
    await Promise.all([
    supabase.from("accounts_payable").select("*"),
    supabase.from("income_sources").select("*"),
    supabase.from("credit_card_invoices").select("*"),
    supabase.from("credit_card_transactions").select("*"),
    supabase.from("reimbursements").select("*"),
    supabase.from("installments").select("*"),
    supabase.from("payment_plans").select("*").eq("status", "active").order("reference_month", { ascending: false }).limit(1),
  ]);

  const activePlan = activePlanResult.data?.[0] ?? null;
  const activePlanItemsResult = activePlan
    ? await supabase.from("payment_plan_items").select("*").eq("payment_plan_id", activePlan.id)
    : { data: [], error: null };

  if (
    accountsResult.error ||
    incomeResult.error ||
    invoicesResult.error ||
    transactionsResult.error ||
    reimbursementsResult.error ||
    installmentsResult.error ||
    activePlanResult.error ||
    activePlanItemsResult.error
  ) {
    return (
      <DashboardError
        message={
          accountsResult.error?.message ??
          incomeResult.error?.message ??
          invoicesResult.error?.message ??
          transactionsResult.error?.message ??
          reimbursementsResult.error?.message ??
          installmentsResult.error?.message ??
          activePlanResult.error?.message ??
          activePlanItemsResult.error?.message ??
          "Erro ao carregar dados."
        }
      />
    );
  }

  const accounts = accountsResult.data ?? [];
  const incomeSources = incomeResult.data ?? [];
  const invoices = invoicesResult.data ?? [];
  const transactions = transactionsResult.data ?? [];
  const reimbursements = reimbursementsResult.data ?? [];
  const installments = installmentsResult.data ?? [];
  const activePlanItems = activePlanItemsResult.data ?? [];
  const summary = buildDashboardSummary(
    accounts,
    incomeSources,
    invoices,
    transactions,
    reimbursements,
    installments,
    activePlan,
    activePlanItems,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Visão mensal"
        title="Dashboard de decisão"
        description="Um ponto de partida visual para entender contas, entradas, reembolsos, faturas e riscos do mês."
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Contas pendentes"
          value={formatCurrency(summary.pendingAccounts)}
          helper="Contas abertas que ainda pressionam o caixa."
          tone="warning"
        />
        <StatCard
          label="Entradas previstas"
          value={formatCurrency(summary.expectedRealIncome)}
          helper="Somente renda real prevista."
          tone="success"
        />
        <StatCard
          label="Saldo projetado"
          value={formatCurrency(summary.projectedBalance)}
          helper="Inclui reembolsos e dinheiro de terceiros, que não são renda livre."
          tone="info"
        />
        <StatCard
          label="Prioridade alta"
          value={formatCurrency(summary.highPriorityAccounts)}
          helper="Contas altas ou críticas."
          tone="danger"
        />
        <StatCard
          label="Fatura crítica"
          value={formatCurrency(summary.criticalInvoiceAmount)}
          helper="Fatura aberta, parcial ou atrasada mais pesada."
          tone={summary.criticalInvoiceAmount > 0 ? "danger" : "neutral"}
        />
        <StatCard
          label="Reembolsos pendentes"
          value={formatCurrency(summary.openReimbursements)}
          helper="Pix esperado para cobrir despesas anteriores."
          tone="warning"
        />
        <StatCard
          label="Dinheiro de terceiros em aberto"
          value={formatCurrency(summary.thirdPartyOpenAmount)}
          helper="Lançamentos de terceiros ou família ainda vinculados."
          tone="warning"
        />
        <StatCard
          label="Custo pessoal líquido estimado"
          value={formatCurrency(summary.estimatedNetPersonalCost)}
          helper="Faturas abertas menos reembolsos esperados."
          tone="info"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <SectionCard title="Plano ativo do mês" description="Resumo do cenário escolhido.">
          {activePlan ? (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-ink-950">{activePlan.name}</p>
                <p className="mt-1 text-sm leading-6 text-ink-600">
                  {activePlan.description ?? "Plano ativo para decisões do mês."}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <StatCard label="Pagar agora" value={formatCurrency(summary.activePlanPayNow)} helper="Saída imediata." tone="danger" />
                <StatCard label="Próxima fatura" value={formatCurrency(summary.activePlanNextInvoicePressure)} helper="Cartão + parcelas." tone="warning" />
              </div>
              <Link className="text-sm font-semibold text-mint-600 hover:text-mint-700" href={`/dashboard/payment-plans/${activePlan.id}`}>
                Abrir plano ativo
              </Link>
            </div>
          ) : (
            <EmptyState title="Nenhum plano ativo" description="Crie ou ative um plano de pagamento para ver o cenário do mês aqui." />
          )}
        </SectionCard>
        <SectionCard title="Atenção agora" description="O que pede decisão primeiro.">
          <p className="text-sm leading-6 text-ink-600">
            Existem {summary.pendingCount} contas pendentes e {summary.overdueCount} atrasadas.
            Priorize contas críticas antes de assumir novas compras.
          </p>
        </SectionCard>
        <SectionCard
          title="Regra do saldo projetado"
          description="Projeção útil, mas com separação conceitual."
        >
          <p className="text-sm leading-6 text-ink-600">
            O saldo projetado soma renda real, reembolsos e dinheiro de terceiros menos contas
            pendentes. Reembolsos e valores de terceiros melhoram o caixa, mas não são dinheiro
            livre para gastar.
          </p>
        </SectionCard>
        <SectionCard title="Risco do mês" description="Faturas e dinheiro vinculado em aberto.">
          <p className="text-sm leading-6 text-ink-600">
            Há {summary.openInvoiceCount} faturas abertas ou atrasadas e {summary.openReimbursementCount} reembolsos pendentes.
            O custo pessoal líquido estimado ajuda a enxergar o impacto real depois dos valores vinculados.
          </p>
        </SectionCard>
        <SectionCard title="Resumo do plano ativo" description="Risco, reembolso e parcelamento.">
          <p className="text-sm leading-6 text-ink-600">
            Itens críticos no plano: {formatCurrency(summary.activePlanCriticalRisk)}. Dependência de reembolsos:
            {" "}{formatCurrency(summary.activePlanReimbursementDependency)}. Parcelamentos ativos somam
            {" "}{formatCurrency(summary.activeInstallmentMonthlyAmount)} por mês.
          </p>
        </SectionCard>
      </section>

      <SectionCard title="Fluxo dos próximos dias" description="Contas e entradas previstas mais próximas.">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-ink-950/10 text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-ink-600">
              <tr>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Descrição</th>
                <th className="px-4 py-3">Valor</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-950/10">
              {summary.flowRows.map((row) => (
                <tr key={`${row.type}-${row.description}-${row.date}`}>
                  <td className="px-4 py-3 text-ink-600">{formatDate(row.date)}</td>
                  <td className="px-4 py-3 text-ink-600">{row.type}</td>
                  <td className="px-4 py-3 font-medium text-ink-950">{row.description}</td>
                  <td className="px-4 py-3 text-ink-950">{formatCurrency(row.amount)}</td>
                  <td className="px-4 py-3 text-ink-600">{row.status}</td>
                </tr>
              ))}
              {summary.flowRows.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-sm text-ink-600" colSpan={5}>
                    Sem contas ou entradas previstas para exibir.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}

function DashboardError({ message }: { message: string }) {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Visão mensal"
        title="Dashboard de decisão"
        description="Não foi possível carregar os dados do dashboard."
      />
      <SectionCard title="Erro de banco de dados">
        <p className="text-sm text-danger-600">{message}</p>
      </SectionCard>
    </div>
  );
}

function buildDashboardSummary(
  accounts: AccountPayable[],
  incomeSources: IncomeSource[],
  invoices: CreditCardInvoice[],
  transactions: CreditCardTransaction[],
  reimbursements: Reimbursement[],
  installments: Installment[],
  activePlan: PaymentPlan | null,
  activePlanItems: PaymentPlanItem[],
) {
  const today = todayISO();
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const nextWeekISO = nextWeek.toISOString().slice(0, 10);

  const pendingAccounts = accounts
    .filter((account) => account.status === "pending" || account.status === "overdue")
    .reduce((total, account) => total + Number(account.amount), 0);

  const highPriorityAccounts = accounts
    .filter((account) => account.priority === "high" || account.priority === "critical")
    .reduce((total, account) => total + Number(account.amount), 0);

  const expectedRealIncome = incomeSources
    .filter((income) => income.status === "expected" && income.inflow_kind === "real_income")
    .reduce((total, income) => total + Number(income.amount), 0);

  const expectedReimbursements = incomeSources
    .filter((income) => income.status === "expected" && income.inflow_kind === "reimbursement")
    .reduce((total, income) => total + Number(income.amount), 0);

  const expectedThirdPartyMoney = incomeSources
    .filter((income) => income.status === "expected" && income.inflow_kind === "third_party_money")
    .reduce((total, income) => total + Number(income.amount), 0);

  const projectedBalance =
    expectedRealIncome + expectedReimbursements + expectedThirdPartyMoney - pendingAccounts;

  const openInvoices = invoices.filter((invoice) =>
    ["open", "closed", "partial", "overdue"].includes(invoice.status),
  );

  const criticalInvoiceAmount = openInvoices.reduce(
    (max, invoice) => Math.max(max, Number(invoice.total_amount) - Number(invoice.paid_amount)),
    0,
  );

  const openReimbursements = reimbursements
    .filter((item) => ["expected", "partial", "late"].includes(item.status))
    .reduce((total, item) => total + Number(item.expected_amount) - Number(item.received_amount), 0);

  const thirdPartyOpenAmount = transactions
    .filter(
      (transaction) =>
        transaction.is_reimbursable ||
        ["third_party", "shared", "family"].includes(transaction.ownership_type),
    )
    .reduce((total, transaction) => total + Number(transaction.amount), 0);

  const openInvoiceTotal = openInvoices.reduce(
    (total, invoice) => total + Number(invoice.total_amount) - Number(invoice.paid_amount),
    0,
  );

  const estimatedNetPersonalCost = Math.max(openInvoiceTotal - openReimbursements, 0);
  const activeInstallmentMonthlyAmount = installments
    .filter((item) => item.status === "active")
    .reduce((total, item) => total + Number(item.installment_amount), 0);

  const activePlanSimulation = activePlan
    ? calculatePaymentPlanScenario({
        items: activePlanItems,
        incomeSources,
        reimbursements,
        installments,
      })
    : null;

  const accountRows = accounts
    .filter(
      (account) =>
        (account.status === "pending" || account.status === "overdue") &&
        account.due_date >= today &&
        account.due_date <= nextWeekISO,
    )
    .map((account) => ({
      date: account.due_date,
      type: "Conta",
      description: account.title,
      amount: Number(account.amount),
      status: account.status === "overdue" ? "Atrasado" : "Pendente",
    }));

  const incomeRows = incomeSources
    .filter(
      (income) =>
        income.status === "expected" &&
        income.expected_date &&
        income.expected_date >= today &&
        income.expected_date <= nextWeekISO,
    )
    .map((income) => ({
      date: income.expected_date ?? today,
      type: income.inflow_kind === "real_income" ? "Receita" : "Entrada vinculada",
      description: income.name,
      amount: Number(income.amount),
      status: income.inflow_kind === "real_income" ? "Prevista" : "Não é renda livre",
    }));

  return {
    pendingAccounts,
    highPriorityAccounts,
    expectedRealIncome,
    expectedReimbursements,
    expectedThirdPartyMoney,
    projectedBalance,
    criticalInvoiceAmount,
    openReimbursements,
    thirdPartyOpenAmount,
    estimatedNetPersonalCost,
    activePlanPayNow: activePlanSimulation?.totalPayNow ?? 0,
    activePlanNextInvoicePressure: activePlanSimulation?.nextInvoicePressure ?? activeInstallmentMonthlyAmount,
    activePlanCriticalRisk: activePlanSimulation?.criticalRiskAmount ?? 0,
    activePlanReimbursementDependency: activePlanSimulation?.reimbursementsExpected ?? openReimbursements,
    activeInstallmentMonthlyAmount,
    openInvoiceCount: openInvoices.length,
    openReimbursementCount: reimbursements.filter((item) =>
      ["expected", "partial", "late"].includes(item.status),
    ).length,
    pendingCount: accounts.filter((account) => account.status === "pending").length,
    overdueCount: accounts.filter((account) => account.status === "overdue").length,
    flowRows: [...accountRows, ...incomeRows].sort((a, b) => a.date.localeCompare(b.date)),
  };
}
