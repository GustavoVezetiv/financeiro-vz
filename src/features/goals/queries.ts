import { roadmapGoals } from "@/features/goals/roadmap-goals";
import type { AppSupabaseClient } from "@/features/shared/types";

export async function listGoals(client: AppSupabaseClient) {
  return client.from("goals").select("*").order("created_at", { ascending: true });
}

export async function createMissingRoadmapGoals(client: AppSupabaseClient, userId: string) {
  const existing = await client
    .from("goals")
    .select("name")
    .in("name", roadmapGoals.map((goal) => goal.name));

  if (existing.error) {
    return { data: null, error: existing.error };
  }

  const existingNames = new Set((existing.data ?? []).map((goal) => goal.name));
  const missingGoals = roadmapGoals.filter((goal) => !existingNames.has(goal.name));

  if (missingGoals.length === 0) {
    return { data: [], error: null };
  }

  return client
    .from("goals")
    .insert(
      missingGoals.map((goal) => ({
        user_id: userId,
        name: goal.name,
        goal_type: "other",
        target_amount: 100,
        current_amount: 0,
        monthly_contribution: 0,
        status: "active",
      })),
    )
    .select("*");
}
