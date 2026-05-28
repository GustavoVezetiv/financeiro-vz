"use client";

import { useEffect, useMemo, useState } from "react";

import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { StatCard } from "@/components/ui/stat-card";
import { createMissingRoadmapGoals, listGoals } from "@/features/goals/queries";
import { getRoadmapGoalMetadata, priorityLabel, roadmapGoals } from "@/features/goals/roadmap-goals";
import { ActionButton, CrudFeedback, TextBadge } from "@/features/shared/crud-ui";
import type { FeedbackState } from "@/features/shared/types";
import { createClient } from "@/lib/supabase/client";
import type { Goal } from "@/lib/supabase/types";

export function GoalsRoadmap() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  const roadmapGoalNames = useMemo(() => new Set(roadmapGoals.map((goal) => goal.name)), []);
  const roadmapItems = goals.filter((goal) => roadmapGoalNames.has(goal.name));
  const customItems = goals.filter((goal) => !roadmapGoalNames.has(goal.name));
  const completed = roadmapItems.filter((goal) => goal.status === "completed").length;
  const active = roadmapItems.filter((goal) => goal.status === "active").length;
  const missing = roadmapGoals.length - roadmapItems.length;

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
    const result = await listGoals(client);

    if (result.error) {
      setFeedback({ type: "error", message: result.error.message });
    } else {
      setGoals(result.data ?? []);
    }

    setLoading(false);
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function handleCreateRoadmap() {
    if (!userId) return;
    setCreating(true);
    setFeedback(null);

    try {
      const result = await createMissingRoadmapGoals(createClient(), userId);

      if (result.error) {
        setFeedback({ type: "error", message: result.error.message });
      } else {
        setFeedback({
          type: "success",
          message:
            (result.data?.length ?? 0) > 0
              ? "Metas do roadmap criadas para seu usuário."
              : "Todas as metas do roadmap já existiam.",
        });
        await loadData();
      }
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Roadmap do produto"
        title="Metas"
        description="Use esta tela para acompanhar as frentes que levam o Financeiro VZ ao sistema decisório final."
        action={
          <ActionButton onClick={() => void handleCreateRoadmap()} disabled={creating || !userId}>
            {creating ? "Criando..." : "Criar metas do roadmap"}
          </ActionButton>
        }
      />
      <CrudFeedback feedback={feedback} />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Metas do roadmap" value={String(roadmapItems.length)} helper="Criadas para seu usuário." tone="info" />
        <StatCard label="Ativas" value={String(active)} helper="Frentes em andamento." tone="warning" />
        <StatCard label="Concluídas" value={String(completed)} helper="Já resolvidas." tone="success" />
        <StatCard label="Faltando criar" value={String(Math.max(missing, 0))} helper="Use o botão do roadmap." tone={missing ? "warning" : "success"} />
      </section>

      <SectionCard title="Como usar as metas" description="Organização de trabalho, não renda livre nem obrigação financeira.">
        <p className="text-sm leading-6 text-ink-600">
          Estas metas representam as frentes do produto: dashboard decisório, fluxo de caixa,
          reembolsos, status de pagamento, importações e automações futuras. Elas não criam dados
          globais; cada meta pertence ao usuário autenticado pela política de RLS.
        </p>
      </SectionCard>

      <SectionCard title="Roadmap do Financeiro VZ">
        {loading ? (
          <p className="text-sm text-ink-600">Carregando metas...</p>
        ) : roadmapItems.length === 0 ? (
          <EmptyState
            title="Roadmap ainda não criado"
            description="Crie as metas do roadmap para acompanhar a evolução do produto por dentro do próprio Financeiro VZ."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-ink-950/10 text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-ink-600">
                <tr>
                  <th className="px-4 py-3">Meta</th>
                  <th className="px-4 py-3">Área</th>
                  <th className="px-4 py-3">Prioridade</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Progresso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-950/10">
                {roadmapItems.map((goal) => {
                  const metadata = getRoadmapGoalMetadata(goal);
                  const progress = Number(goal.current_amount || 0);

                  return (
                    <tr key={goal.id}>
                      <td className="px-4 py-3 font-medium text-ink-950">{goal.name}</td>
                      <td className="px-4 py-3 text-ink-600">{metadata?.area ?? "Meta pessoal"}</td>
                      <td className="px-4 py-3">
                        <TextBadge tone={metadata?.priority === "critical" ? "danger" : metadata?.priority === "high" ? "warning" : "info"}>
                          {metadata ? priorityLabel(metadata.priority) : "Normal"}
                        </TextBadge>
                      </td>
                      <td className="px-4 py-3 text-ink-600">{goal.status}</td>
                      <td className="px-4 py-3 text-ink-600">{progress}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {customItems.length > 0 ? (
        <SectionCard title="Outras metas">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {customItems.map((goal) => (
              <div key={goal.id} className="rounded-md border border-ink-950/10 bg-white p-4">
                <p className="text-sm font-semibold text-ink-950">{goal.name}</p>
                <p className="mt-1 text-sm text-ink-600">{goal.status}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      ) : null}
    </div>
  );
}
