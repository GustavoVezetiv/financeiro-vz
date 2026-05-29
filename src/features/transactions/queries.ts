import type { AppSupabaseClient } from "@/features/shared/types";
import type { TransactionFormValues, TransactionRow } from "@/features/transactions/types";

export async function listTransactionSupportData(client: AppSupabaseClient) {
  const [cards, invoices, categories, people] = await Promise.all([
    client.from("credit_cards").select("id,name").order("name", { ascending: true }),
    client
      .from("credit_card_invoices")
      .select("id,credit_card_id,reference_month,due_date")
      .order("due_date", { ascending: false }),
    client.from("categories").select("id,name,type,color,icon").order("name", { ascending: true }),
    client.from("people").select("id,name").order("name", { ascending: true }),
  ]);

  return { cards, invoices, categories, people };
}

export async function listInvoiceTransactions(client: AppSupabaseClient, invoiceId: string) {
  return client
    .from("credit_card_transactions")
    .select("*")
    .eq("invoice_id", invoiceId)
    .order("transaction_date", { ascending: false });
}

export async function createTransaction(
  client: AppSupabaseClient,
  userId: string,
  values: TransactionFormValues,
) {
  return client
    .from("credit_card_transactions")
    .insert(toPayload(userId, values))
    .select("*")
    .single();
}

export async function updateTransaction(
  client: AppSupabaseClient,
  id: string,
  values: TransactionFormValues,
) {
  return client
    .from("credit_card_transactions")
    .update(toPayload(undefined, values))
    .eq("id", id)
    .select("*")
    .single();
}

export async function deleteTransaction(client: AppSupabaseClient, id: string) {
  return client.from("credit_card_transactions").delete().eq("id", id);
}

export async function createExpectedReimbursementForTransaction(
  client: AppSupabaseClient,
  userId: string,
  transaction: TransactionRow,
  expectedDate: string,
) {
  return client.from("reimbursements").insert({
    user_id: userId,
    person_id: transaction.person_id as string,
    credit_card_transaction_id: transaction.id,
    credit_card_invoice_id: transaction.invoice_id,
    description: transaction.description,
    expected_amount: Number(transaction.amount),
    received_amount: 0,
    expected_date: expectedDate || null,
    status: "expected",
    source_type: "credit_card_transaction",
    source_id: transaction.id,
  });
}

function toPayload(
  userId: string | undefined,
  values: TransactionFormValues,
): Partial<TransactionRow> {
  return {
    ...(userId ? { user_id: userId } : {}),
    credit_card_id: values.credit_card_id,
    invoice_id: values.invoice_id || null,
    transaction_date: values.transaction_date,
    description: values.description.trim(),
    amount: Number(values.amount || 0),
    category_id: values.category_id || null,
    person_id: values.person_id || null,
    ownership_type: values.ownership_type,
    installment_number: values.is_installment_purchase && values.installment_number ? Number(values.installment_number) : null,
    installment_total: values.is_installment_purchase && values.installment_total ? Number(values.installment_total) : null,
    is_reimbursable: values.is_reimbursable,
    reimbursement_status: values.is_reimbursable ? "expected" : "not_applicable",
    notes: values.notes.trim() || null,
  };
}
