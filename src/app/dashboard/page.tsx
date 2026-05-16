import { DataTablePlaceholder } from "@/components/ui/data-table-placeholder";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { StatCard } from "@/components/ui/stat-card";
import {
  dashboardDecisionSections,
  dashboardStats,
  upcomingFlowRows,
} from "@/lib/mock-data";

export const metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Visão mensal"
        title="Dashboard de decisão"
        description="Um ponto de partida visual para entender contas, entradas, reembolsos, faturas e riscos do mês."
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {dashboardStats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {dashboardDecisionSections.map((section) => (
          <SectionCard key={section.title} title={section.title} description={section.description}>
            <p className="text-sm leading-6 text-ink-600">{section.content}</p>
          </SectionCard>
        ))}
      </section>

      <DataTablePlaceholder
        title="Fluxo dos próximos dias"
        description="Prévia visual dos próximos movimentos. Os dados abaixo são mockados e serão substituídos por Supabase depois."
        columns={["Data", "Tipo", "Descrição", "Valor", "Status"]}
        rows={upcomingFlowRows}
      />
    </div>
  );
}

