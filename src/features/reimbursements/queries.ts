import type {
  ReimbursementFormValues,
  ReimbursementRow,
} from "@/features/reimbursements/types";
import type { AppSupabaseClient } from "@/features/shared/types";

export async function listReimbursements(client: AppSupabaseClient) {
  return client.from("reimbursements").select("*").order("expected_date", { ascending: true });
}

export async function listReimbursementSupportData(client: AppSupabaseClient) {
  const [people, transactions, accounts, income] = await Promise.all([
    client.from("people").select("id,name").order("name", { ascending: true }),
    client
      .from("credit_card_transactions")
      .select("id,description,amount,transaction_date")
      .order("transaction_date", { ascending: false }),
    client.from("accounts_payable").select("id,title,amount").order("due_date", { ascending: false }),
    client.from("income_sources").select("id,name,amount").order("expected_date", { ascending: false }),
  ]);

  return { people, transactions, accounts, income };
}

export async function createReimbursement(
  client: AppSupabaseClient,
  userId: string,
  values: ReimbursementFormValues,
) {
  return client.from("reimbursements").insert(toPayload(userId, values)).select("*").single();
}

export async function updateReimbursement(
  client: AppSupabaseClient,
  id: string,
  values: ReimbursementFormValues,
) {
  return client.from("reimbursements").update(toPayload(undefined, values)).eq("id", id).select("*").single();
}

export async function deleteReimbursement(client: AppSupabaseClient, id: string) {
  return client.from("reimbursements").delete().eq("id", id);
}

function toPayload(
  userId: string | undefined,
  values: ReimbursementFormValues,
): Partial<ReimbursementRow> {
  const linkedTransactionId = values.credit_card_transaction_id || null;
  const linkedAccountId = values.account_payable_id || null;

  return {
    ...(userId ? { user_id: userId } : {}),
    person_id: values.person_id,
    credit_card_transaction_id: linkedTransactionId,
    account_payable_id: linkedAccountId,
    income_source_id: values.income_source_id || null,
    description: values.description.trim() || null,
    expected_amount: Number(values.expected_amount || 0),
    received_amount: Number(values.received_amount || 0),
    expected_date: values.expected_date || null,
    received_date: values.received_date || null,
    received_at: values.received_date ? `${values.received_date}T00:00:00.000Z` : null,
    status: values.status,
    source_type: linkedTransactionId
      ? "credit_card_transaction"
      : linkedAccountId
        ? "account_payable"
        : "manual",
    source_id: linkedTransactionId ?? linkedAccountId,
    notes: values.notes.trim() || null,
  };
}
