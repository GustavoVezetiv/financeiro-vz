import type { NoteFormValues, NoteRow } from "@/features/notes/types";
import type { AppSupabaseClient } from "@/features/shared/types";

export async function listNotes(client: AppSupabaseClient) {
  return client.from("notes").select("*").order("pinned", { ascending: false }).order("updated_at", { ascending: false });
}

export async function createNote(client: AppSupabaseClient, userId: string, values: NoteFormValues) {
  return client.from("notes").insert(toPayload(userId, values)).select("*").single();
}

export async function updateNote(client: AppSupabaseClient, id: string, values: NoteFormValues) {
  return client.from("notes").update(toPayload(undefined, values)).eq("id", id).select("*").single();
}

export async function deleteNote(client: AppSupabaseClient, id: string) {
  return client.from("notes").delete().eq("id", id);
}

function toPayload(userId: string | undefined, values: NoteFormValues): Partial<NoteRow> {
  return {
    ...(userId ? { user_id: userId } : {}),
    title: values.title.trim() || null,
    body: values.body.trim(),
    entity_type: values.entity_type,
    entity_id: null,
    pinned: values.pinned,
  };
}
