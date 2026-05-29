import type {
  AccountPayableFormValues,
  AccountPayableRow,
} from "@/features/accounts-payable/types";
import type { AppSupabaseClient } from "@/features/shared/types";

export type GenerateRecurringAccountsResult = {
  created: number;
  skipped: number;
  error: { message: string } | null;
};

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

export async function generateRecurringAccounts(
  client: AppSupabaseClient,
  userId: string,
  account: AccountPayableRow,
  requestedOccurrences: number,
): Promise<GenerateRecurringAccountsResult> {
  const occurrences = Math.min(Math.max(Math.floor(requestedOccurrences), 1), 24);
  const frequency = account.recurrence_frequency;

  if (!account.is_recurring || !isRecurrenceFrequency(frequency)) {
    return {
      created: 0,
      skipped: 0,
      error: { message: "Esta conta não está configurada como recorrente." },
    };
  }

  const parentId = account.recurrence_parent_id ?? account.id;
  const baseDate = account.recurrence_generated_until ?? account.recurrence_start_date ?? account.due_date;
  const endDate = account.recurrence_end_date;
  const candidateDates: string[] = [];
  let cursor = baseDate;

  for (let index = 0; index < occurrences; index += 1) {
    cursor = addFrequency(cursor, frequency);

    if (endDate && cursor > endDate) {
      break;
    }

    candidateDates.push(cursor);
  }

  if (candidateDates.length === 0) {
    return {
      created: 0,
      skipped: 0,
      error: { message: "Nenhuma ocorrência futura dentro do período da recorrência." },
    };
  }

  const existingResult = await client
    .from("accounts_payable")
    .select("id,title,amount,due_date,recurrence_parent_id")
    .eq("user_id", userId)
    .eq("recurrence_parent_id", parentId)
    .in("due_date", candidateDates);

  if (existingResult.error) {
    console.error("Erro técnico ao verificar contas recorrentes existentes:", existingResult.error);
    return { created: 0, skipped: 0, error: { message: "Não foi possível verificar ocorrências existentes." } };
  }

  const existingKeys = new Set(
    (existingResult.data ?? []).map((item) => buildDuplicateKey(item.title, Number(item.amount), item.due_date)),
  );
  const rowsToInsert = candidateDates
    .filter((date) => !existingKeys.has(buildDuplicateKey(account.title, Number(account.amount), date)))
    .map((date) => ({
      user_id: userId,
      category_id: account.category_id,
      person_id: account.person_id,
      title: account.title,
      description: account.description,
      amount: Number(account.amount),
      due_date: date,
      status: "pending",
      priority: account.priority,
      risk_level: account.risk_level,
      payment_method_planned: account.payment_method_planned,
      can_delay: account.can_delay,
      delay_risk: account.delay_risk,
      notes: account.notes,
      is_recurring: true,
      recurrence_rule: account.recurrence_rule,
      recurrence_frequency: frequency,
      recurrence_start_date: account.recurrence_start_date ?? account.due_date,
      recurrence_end_date: account.recurrence_end_date,
      recurrence_parent_id: parentId,
      paid_at: null,
    }));

  let created = 0;

  if (rowsToInsert.length > 0) {
    const insertResult = await client.from("accounts_payable").insert(rowsToInsert).select("id");

    if (insertResult.error) {
      console.error("Erro técnico ao gerar contas recorrentes:", insertResult.error);
      return {
        created: 0,
        skipped: candidateDates.length - rowsToInsert.length,
        error: { message: "Não foi possível gerar as próximas contas." },
      };
    }

    created = insertResult.data?.length ?? rowsToInsert.length;
  }

  const lastGeneratedDate = candidateDates[candidateDates.length - 1];
  const updateResult = await client
    .from("accounts_payable")
    .update({ recurrence_generated_until: lastGeneratedDate })
    .eq("id", parentId);

  if (updateResult.error) {
    console.error("Erro técnico ao atualizar controle da recorrência:", updateResult.error);
    return {
      created,
      skipped: candidateDates.length - rowsToInsert.length,
      error: { message: "As contas foram geradas, mas o controle da recorrência não foi atualizado." },
    };
  }

  return {
    created,
    skipped: candidateDates.length - rowsToInsert.length,
    error: null,
  };
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
    is_recurring: values.is_recurring,
    recurrence_frequency: values.is_recurring ? values.recurrence_frequency : null,
    recurrence_start_date: values.is_recurring ? values.recurrence_start_date || values.due_date : null,
    recurrence_end_date: values.is_recurring && values.recurrence_end_date ? values.recurrence_end_date : null,
    recurrence_rule: values.is_recurring
      ? {
          frequency: values.recurrence_frequency,
          start_date: values.recurrence_start_date || values.due_date,
          end_date: values.recurrence_end_date || null,
        }
      : null,
  };
}

function isRecurrenceFrequency(value: string | null): value is "monthly" | "weekly" | "yearly" {
  return value === "monthly" || value === "weekly" || value === "yearly";
}

function addFrequency(date: string, frequency: "monthly" | "weekly" | "yearly") {
  const [year, month, day] = date.split("-").map(Number);
  const cursor = new Date(year, month - 1, day);

  if (frequency === "weekly") {
    cursor.setDate(cursor.getDate() + 7);
  }

  if (frequency === "monthly") {
    cursor.setMonth(cursor.getMonth() + 1);
  }

  if (frequency === "yearly") {
    cursor.setFullYear(cursor.getFullYear() + 1);
  }

  return toDateInputValue(cursor);
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildDuplicateKey(title: string, amount: number, dueDate: string) {
  return `${title.trim().toLowerCase()}|${amount.toFixed(2)}|${dueDate}`;
}
