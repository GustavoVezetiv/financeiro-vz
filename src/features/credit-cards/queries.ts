import type { CreditCardFormValues, CreditCardRow } from "@/features/credit-cards/types";
import type { AppSupabaseClient } from "@/features/shared/types";

export async function listCreditCards(client: AppSupabaseClient) {
  return client.from("credit_cards").select("*").order("name", { ascending: true });
}

export async function createCreditCard(
  client: AppSupabaseClient,
  userId: string,
  values: CreditCardFormValues,
) {
  return client.from("credit_cards").insert(toPayload(userId, values)).select("*").single();
}

export async function updateCreditCard(
  client: AppSupabaseClient,
  id: string,
  values: CreditCardFormValues,
) {
  return client.from("credit_cards").update(toPayload(undefined, values)).eq("id", id).select("*").single();
}

export async function deleteCreditCard(client: AppSupabaseClient, id: string) {
  return client.from("credit_cards").delete().eq("id", id);
}

function toPayload(userId: string | undefined, values: CreditCardFormValues): Partial<CreditCardRow> {
  return {
    ...(userId ? { user_id: userId } : {}),
    name: values.name.trim(),
    issuer: values.issuer.trim() || null,
    brand: values.brand.trim() || null,
    closing_day: values.closing_day ? Number(values.closing_day) : null,
    due_day: values.due_day ? Number(values.due_day) : null,
    limit_amount: values.limit_amount ? Number(values.limit_amount) : null,
    notes: values.notes.trim() || null,
    is_active: values.is_active,
  };
}

