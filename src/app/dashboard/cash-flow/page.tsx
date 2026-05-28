import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { StatCard } from "@/components/ui/stat-card";
import { buildFinancialSummary, type FlowRow } from "@/features/decision/financial-summary";
import { formatCurrency, formatDate } from "@/features/shared/format";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Fluxo de caixa",
};

export default async function CashFlowPage() {
  const supabase = await createClient();

  if (!supabase) {
    return <CashFlowError message="Supabase não está configurado." />;
  }

  const [
    accountsResult,
    incomeResult,
    invoicesResult,
    transactionsResult,
    reimbursementsResult,
    installmentsResult,
    activePlanResult,
  ] = await Promise.all([
    supabase.from("accounts_payable").select("*"),
    supabase.from("income_sources").select("*"),
    supabase.from("credit_card_invoices").select("*"),
    supabase.from("credit_card_transactions").select("*"),
    supabase.from("reimbursements").select("*"),
    supabase.from("installments").select("*"),
    supabase
      .from("payment_plans")
      .select("*")
      .eq("status", "active")
      .order("reference_month", { ascending: false })
      .limit(1),
  ]);

  const activePlan = activePlanResult.data?.[0] ?? null;
  const activePlanItemsResult = activePlan
    ? await supabase.from("payment_plan_items").select("*").eq("payment_plan_id", activePlan.id)
    : { data: [], error: null };

  const error =
    accountsResult.error ??
    incomeResult.error ??
    invoicesResult.error ??
    transactionsResult.error ??
    reimbursementsResult.error ??
    installmentsResult.error ??
    activePlanResult.error ??
    activePlanItemsResult.error;

  if (error) {
    return <CashFlowError message={error.message} />;
  }

  const summary = buildFinancialSummary({
    accounts: accountsResult.data ?? [],
    incomeSources: incomeResult.data ?? [],
    invoices: invoicesResult.data ?? [],
    transactions: transactionsResult.data ?? [],
    reimbursements: reimbursementsResult.data ?? [],
    installments: installmentsResult.data ?? [],
    activePlan,
    activePlanItems: activePlanItemsResult.data ?? [],
  });

  const incomingRows = summary.flowRows.filter((row) => row.direction === "in");
  const outgoingRows = summary.flowRows.filter((row) => row.direction === "out");

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Projeção mensal"
        title="Fluxo de caixa"
        description="Visão do mês separando renda real, dinheiro vinculado, obrigações e pressão futura."
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Renda real prevista"
          value={formatCurrency(summary.realIncomeExpected)}
          helper="Dinheiro livre esperado neste mês."
          tone="success"
        />
        <StatCard
          label="Reembolsos previstos"
          value={formatCurrency(summary.reimbursementsExpected + summary.openReimbursementAmount)}
          helper="Compensa gastos anteriores; não é renda livre."
          tone="warning"
        />
        <StatCard
          label="Dinheiro de terceiros"
          value={formatCurrency(summary.thirdPartyMoneyExpected)}
          helper="Entrada vinculada a outra pessoa."
          tone="warning"
        />
        <StatCard
          label="Saldo projetado"
          value={formatCurrency(summary.projectedBalance)}
          helper="Inclui entradas vinculadas para visão de caixa."
          tone={summary.projectedBalance < 0 ? "danger" : "info"}
        />
        <StatCard
          label="Contas pendentes"
          value={formatCurrency(summary.pendingAccounts)}
          helper="Obrigações abertas do mês."
          tone="warning"
        />
        <StatCard
          label="Faturas abertas"
          value={formatCurrency(summary.openInvoices)}
          helper="Total aberto ou vencido em cartões."
          tone="danger"
        />
        <StatCard
          label="Parcelamentos ativos"
          value={formatCurrency(summary.activeInstallmentsMonthly)}
          helper="Impacto mensal dos parcelamentos."
          tone="info"
        />
        <StatCard
          label="Pressão do próximo mês"
          value={formatCurrency(summary.nextMonthPressure)}
          helper="Contas, faturas e parcelas futuras."
          tone="warning"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <SectionCard title="Saldo livre estimado" description="Sem tratar reembolso e terceiros como renda livre.">
          <StatCard
            label="Após obrigações reais"
            value={formatCurrency(summary.freeCashAfterRealObligations)}
            helper="Renda real menos contas, faturas e parcelas."
            tone={summary.freeCashAfterRealObligations < 0 ? "danger" : "success"}
          />
          <p className="mt-4 text-sm leading-6 text-ink-600">
            Reembolsos e dinheiro de terceiros aparecem no saldo projetado para medir caixa, mas
            ficam fora desta visão de dinheiro livre.
          </p>
        </SectionCard>
        <SectionCard title="Dependência de dinheiro vinculado" description="Quanto o mês depende de entradas que não são renda.">
          <StatCard
            label="Entradas vinculadas"
            value={formatCurrency(summary.linkedMoneyExpected)}
            helper={`Dependência aproximada: ${(summary.reimbursementDependencyRatio * 100).toFixed(0)}% da renda real.`}
            tone={summary.linkedMoneyExpected > 0 ? "warning" : "neutral"}
          />
          <p className="mt-4 text-sm leading-6 text-ink-600">
            Se este valor atrasar, o plano do mês pode ficar apertado mesmo que o saldo projetado
            pareça positivo.
          </p>
        </SectionCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <FlowTable title="Entradas do mês" rows={incomingRows} />
        <FlowTable title="Saídas do mês" rows={outgoingRows} />
      </section>
    </div>
  );
}

function FlowTable({ title, rows }: { title: string; rows: FlowRow[] }) {
  return (
    <SectionCard title={title}>
      {rows.length === 0 ? (
        <EmptyState title="Nada previsto" description="Nenhum item deste tipo foi encontrado para o mês atual." />
      ) : (
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
              {rows.map((row) => (
                <tr key={`${row.type}-${row.description}-${row.date}-${row.amount}`}>
                  <td className="px-4 py-3 text-ink-600">{formatDate(row.date)}</td>
                  <td className="px-4 py-3 text-ink-600">{row.type}</td>
                  <td className="px-4 py-3 font-medium text-ink-950">{row.description}</td>
                  <td className="px-4 py-3 text-ink-950">{formatCurrency(row.amount)}</td>
                  <td className="px-4 py-3 text-ink-600">{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}

function CashFlowError({ message }: { message: string }) {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Projeção mensal"
        title="Fluxo de caixa"
        description="Não foi possível carregar o fluxo de caixa."
      />
      <SectionCard title="Erro de banco de dados">
        <p className="text-sm text-danger-600">{message}</p>
      </SectionCard>
    </div>
  );
}
