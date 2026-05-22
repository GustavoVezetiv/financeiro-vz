import { DataTablePlaceholder } from "@/components/ui/data-table-placeholder";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { placeholderModules } from "@/lib/mock-data";

type ModulePlaceholderPageProps = {
  moduleKey: keyof typeof placeholderModules;
};

const placeholderRows = [
  ["--", "Em breve", "R$ 0,00", "Indisponível", "Beta privado"],
  ["--", "Módulo ainda não liberado", "R$ 0,00", "Planejado", "Futuro"],
];

export function ModulePlaceholderPage({ moduleKey }: ModulePlaceholderPageProps) {
  const moduleConfig = placeholderModules[moduleKey];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={moduleConfig.eyebrow}
        title={moduleConfig.title}
        description={moduleConfig.description}
      />

      <EmptyState
        title={moduleConfig.emptyTitle}
        description={moduleConfig.emptyDescription}
      />

      <SectionCard
        title="Em breve"
        description="Este módulo está visível para navegação, mas ainda não deve ser usado como funcionalidade pronta no beta."
      >
        <DataTablePlaceholder
          title={`Prévia de ${moduleConfig.title.toLowerCase()}`}
          columns={moduleConfig.columns}
          rows={placeholderRows}
        />
      </SectionCard>
    </div>
  );
}
