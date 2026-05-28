import type { Goal } from "@/lib/supabase/types";

export type RoadmapGoal = {
  name: string;
  priority: "critical" | "high" | "medium" | "low";
  area: string;
};

export const roadmapGoals: RoadmapGoal[] = [
  { name: "Consolidar dashboard decisório", priority: "critical", area: "Sistema de decisão" },
  { name: "Melhorar fluxo de caixa mensal", priority: "critical", area: "Sistema de decisão" },
  { name: "Fortalecer vínculo de reembolsos", priority: "high", area: "Modelo financeiro correto" },
  { name: "Integrar pagamento com status", priority: "medium", area: "Operação mensal" },
  { name: "Amadurecer planos de pagamento", priority: "medium", area: "Planejamento" },
  { name: "Expandir importações", priority: "medium", area: "Entrada rápida" },
  { name: "Melhorar prévia de importação", priority: "medium", area: "Entrada rápida" },
  { name: "Revisar módulos Em breve", priority: "low", area: "Beta privado" },
  { name: "Preparar automações futuras", priority: "low", area: "Roadmap futuro" },
];

export function getRoadmapGoalMetadata(goal: Goal) {
  return roadmapGoals.find((item) => item.name === goal.name);
}

export function priorityLabel(priority: RoadmapGoal["priority"]) {
  const labels: Record<RoadmapGoal["priority"], string> = {
    critical: "Crítica",
    high: "Alta",
    medium: "Média",
    low: "Baixa",
  };

  return labels[priority];
}
