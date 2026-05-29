import type {
  AccountPayableFormValues,
  AccountPayableRow,
} from "@/features/accounts-payable/types";
import type { AppSupabaseClient } from "@/features/shared/types";

export async function listAccountsPayable(client: AppSupabaseClient) {
  return client.from("accounts_payable").select("*").order("due_date", { ascending: true });
}

export async function createAccountPayable(
  client: AppSupabaseClient,
  userId: string,
  values: AccountPayableFormValues,
) {
  return client
    .from("accounts_payable")
    .insert(toPayload(userId, values))
    .select("*")
    .single();
}

export async function updateAccountPayable(
  client: AppSupabaseClient,
  id: string,
  values: AccountPayableFormValues,
) {
  return client
    .from("accounts_payable")
    .update(toPayload(undefined, values))
    .eq("id", id)
    .select("*")
    .single();
}

export async function deleteAccountPayable(client: AppSupabaseClient, id: string) {
  return client.from("accounts_payable").delete().eq("id", id);
}

export async function listAccountSupportData(client: AppSupabaseClient) {
  const [categories, people] = await Promise.all([
    client
      .from("categories")
      .select("id,name,type,color,icon")
      .in("type", ["expense", "debt", "reimbursement", "other"])
      .order("name", { ascending: true }),
    client.from("people").select("id,name").order("name", { ascending: true }),
  ]);

  return { categories, people };
}

function toPayload(
  userId: string | undefined,
  values: AccountPayableFormValues,
): Partial<AccountPayableRow> {
  return {
    ...(userId ? { user_id: userId } : {}),
    title: values.title.trim(),
    description: values.description.trim() || null,
    amount: Number(values.amount || 0),
    due_date: values.due_date,
    category_id: values.category_id || null,
    person_id: values.person_id || null,
    priority: values.priority,
    status: values.status,
    payment_method_planned: values.payment_method_planned,
    can_delay: values.can_delay,
    delay_risk: values.delay_risk,
    notes: values.notes.trim() || null,
  };
}
