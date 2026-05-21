import type { AppSupabaseClient } from "@/features/shared/types";
import type { PersonFormValues, PersonRow } from "@/features/people/types";

export async function listPeople(client: AppSupabaseClient) {
  return client.from("people").select("*").order("name", { ascending: true });
}

export async function createPerson(
  client: AppSupabaseClient,
  userId: string,
  values: PersonFormValues,
) {
  return client.from("people").insert(toPayload(userId, values)).select("*").single();
}

export async function updatePerson(
  client: AppSupabaseClient,
  id: string,
  values: PersonFormValues,
) {
  return client
    .from("people")
    .update(toPayload(undefined, values))
    .eq("id", id)
    .select("*")
    .single();
}

export async function deletePerson(client: AppSupabaseClient, id: string) {
  return client.from("people").delete().eq("id", id);
}

function toPayload(userId: string | undefined, values: PersonFormValues): Partial<PersonRow> {
  return {
    ...(userId ? { user_id: userId } : {}),
    name: values.name.trim(),
    relationship_type: values.relationship_type,
    email: values.email.trim() || null,
    phone: values.phone.trim() || null,
    notes: values.notes.trim() || null,
    is_active: values.is_active,
  };
}

