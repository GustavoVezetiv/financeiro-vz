import type {
  IncomeSourceFormValues,
  IncomeSourceRow,
} from "@/features/income-sources/types";
import { inflowKindFromType } from "@/features/income-sources/types";
import type { AppSupabaseClient } from "@/features/shared/types";

export async function listIncomeSources(client: AppSupabaseClient) {
  return client.from("income_sources").select("*").order("expected_date", { ascending: true });
}

export async function createIncomeSource(
  client: AppSupabaseClient,
  userId: string,
  values: IncomeSourceFormValues,
) {
  return client.from("income_sources").insert(toPayload(userId, values)).select("*").single();
}

export async function updateIncomeSource(
  client: AppSupabaseClient,
  id: string,
  values: IncomeSourceFormValues,
) {
  return client
    .from("income_sources")
    .update(toPayload(undefined, values))
    .eq("id", id)
    .select("*")
    .single();
}

export async function deleteIncomeSource(client: AppSupabaseClient, id: string) {
  return client.from("income_sources").delete().eq("id", id);
}

export async function listIncomeSupportData(client: AppSupabaseClient) {
  const [categories, people] = await Promise.all([
    client
      .from("categories")
      .select("id,name,type,color,icon")
      .in("type", ["income", "reimbursement", "other"])
      .order("name", { ascending: true }),
    client.from("people").select("id,name").order("name", { ascending: true }),
  ]);

  return { categories, people };
}

function toPayload(
  userId: string | undefined,
  values: IncomeSourceFormValues,
): Partial<IncomeSourceRow> {
  const receivedDate = values.received_date || null;

  return {
    ...(userId ? { user_id: userId } : {}),
    name: values.source.trim(),
    description: values.description.trim() || null,
    amount: Number(values.amount || 0),
    expected_date: values.expected_date || null,
    received_date: receivedDate,
    received_at: receivedDate ? `${receivedDate}T00:00:00.000Z` : null,
    category_id: values.category_id || null,
    person_id: values.person_id || null,
    source_type: values.type,
    inflow_kind: inflowKindFromType(values.type),
    confidence: values.confidence,
    status: values.status,
    notes: values.notes.trim() || null,
  };
}
