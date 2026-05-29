import type { AppSupabaseClient } from "@/features/shared/types";
import type { InstallmentFormValues, InstallmentRow } from "@/features/installments/types";
import { createSafeUuid } from "@/lib/uuid";

export async function listInstallments(client: AppSupabaseClient) {
  return client.from("installments").select("*").order("due_month", { ascending: true });
}

export async function listInstallmentSupportData(client: AppSupabaseClient) {
  const [cards, invoices, categories, people] = await Promise.all([
    client.from("credit_cards").select("id,name").order("name", { ascending: true }),
    client.from("credit_card_invoices").select("id,reference_month,due_date").order("due_date", { ascending: false }),
    client.from("categories").select("id,name").order("name", { ascending: true }),
    client.from("people").select("id,name").order("name", { ascending: true }),
  ]);

  return { cards, invoices, categories, people };
}

export async function createInstallment(client: AppSupabaseClient, userId: string, values: InstallmentFormValues) {
  return client
    .from("installments")
    .insert({
      ...toPayload(userId, values),
      // Kept for compatibility with databases that have not run the default UUID migration yet.
      installment_group_id: createSafeUuid(),
    })
    .select("*")
    .single();
}

export async function updateInstallment(client: AppSupabaseClient, id: string, values: InstallmentFormValues) {
  return client.from("installments").update(toPayload(undefined, values)).eq("id", id).select("*").single();
}

export async function deleteInstallment(client: AppSupabaseClient, id: string) {
  return client.from("installments").delete().eq("id", id);
}

function toPayload(userId: string | undefined, values: InstallmentFormValues): Partial<InstallmentRow> {
  const total = Number(values.installment_total || 1);
  const current = Number(values.current_installment || 1);
  const startDate = values.start_date || values.end_date;

  return {
    ...(userId ? { user_id: userId } : {}),
    description: values.description.trim(),
    total_amount: Number(values.total_amount || 0),
    installment_amount: Number(values.installment_amount || 0),
    installment_total: total,
    current_installment: current,
    installment_count: total,
    installment_number: current,
    due_month: startDate,
    start_date: startDate || null,
    end_date: values.end_date || null,
    credit_card_id: values.credit_card_id || null,
    invoice_id: values.invoice_id || null,
    category_id: values.category_id || null,
    person_id: values.person_id || null,
    installment_origin: values.installment_origin,
    status: values.status,
    notes: values.notes.trim() || null,
  };
}
