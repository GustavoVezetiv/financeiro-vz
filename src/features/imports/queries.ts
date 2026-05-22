import { buildInsertPayload } from "@/features/imports/import-engine";
import type { ImportTarget, PreviewRow, ReferenceData } from "@/features/imports/types";
import type { AppSupabaseClient } from "@/features/shared/types";
import type { ImportBatch, ImportRow } from "@/lib/supabase/types";

export async function listImportBatches(client: AppSupabaseClient) {
  return client.from("import_batches").select("*").order("created_at", { ascending: false }).limit(20);
}

export async function loadImportReferenceData(client: AppSupabaseClient): Promise<ReferenceData> {
  const [
    people,
    categories,
    cards,
    invoices,
    accounts,
    incomeSources,
    transactions,
    reimbursements,
  ] = await Promise.all([
    client.from("people").select("id,name").order("name"),
    client.from("categories").select("id,name,type").order("name"),
    client.from("credit_cards").select("id,name,issuer").order("name"),
    client.from("credit_card_invoices").select("id,credit_card_id,reference_month,due_date"),
    client.from("accounts_payable").select("id,title,amount,due_date"),
    client.from("income_sources").select("id,name,amount,expected_date"),
    client.from("credit_card_transactions").select("invoice_id,transaction_date,description,amount"),
    client.from("reimbursements").select("person_id,description,expected_amount,expected_date"),
  ]);

  return {
    people: people.data ?? [],
    categories: categories.data ?? [],
    cards: cards.data ?? [],
    invoices: invoices.data ?? [],
    accounts: accounts.data ?? [],
    incomeSources: incomeSources.data ?? [],
    existing: {
      people: people.data ?? [],
      categories: categories.data ?? [],
      accounts_payable: accounts.data ?? [],
      income_sources: incomeSources.data ?? [],
      credit_cards: cards.data ?? [],
      credit_card_invoices: invoices.data ?? [],
      credit_card_transactions: transactions.data ?? [],
      reimbursements: reimbursements.data ?? [],
    },
  };
}

export async function saveImportPreview(
  client: AppSupabaseClient,
  userId: string,
  target: ImportTarget,
  file: File,
  rows: PreviewRow[],
) {
  const validRows = rows.filter((row) => row.status === "valid").length;
  const invalidRows = rows.filter((row) => row.status === "invalid").length;
  const fileType = file.name.toLowerCase().endsWith(".xlsx") ? "xlsx" : "csv";

  const batch = await client
    .from("import_batches")
    .insert({
      user_id: userId,
      module: target,
      target_type: target,
      file_name: file.name,
      file_type: fileType,
      status: "parsed",
      total_rows: rows.length,
      valid_rows: validRows,
      invalid_rows: invalidRows,
      mapping_config: null,
    } satisfies Partial<ImportBatch>)
    .select("*")
    .single();

  if (batch.error) return { batch, rows: null };

  const rowPayload = rows.map((row) => ({
    user_id: userId,
    import_batch_id: batch.data.id,
    row_number: row.rowNumber,
    raw_data: row.raw,
    parsed_data: row.mapped,
    mapped_data: row.mapped,
    validation_errors: row.errors,
    errors: row.errors,
    status: row.status,
    target_entity_type: target,
  })) satisfies Partial<ImportRow>[];

  const rowResult = await client.from("import_rows").insert(rowPayload).select("*");

  return { batch, rows: rowResult };
}

export async function confirmImportRows(
  client: AppSupabaseClient,
  userId: string,
  batchId: string,
  target: ImportTarget,
  rows: PreviewRow[],
) {
  const results: PreviewRow[] = [];

  for (const row of rows) {
    if (row.status !== "valid") {
      results.push(row);
      continue;
    }

    const payload = buildInsertPayload(target, userId, row.mapped);
    const insertResult = await insertTargetRow(client, target, payload);

    if (insertResult.error) {
      const failed = { ...row, status: "failed" as const, errors: [insertResult.error.message] };
      results.push(failed);
      await client
        .from("import_rows")
        .update({
          status: "failed",
          errors: failed.errors,
          validation_errors: failed.errors,
        })
        .eq("import_batch_id", batchId)
        .eq("row_number", row.rowNumber);
      continue;
    }

    const imported = { ...row, status: "imported" as const, errors: [] };
    results.push(imported);
    await client
      .from("import_rows")
      .update({
        status: "imported",
        target_entity_id: insertResult.data?.id ?? null,
      })
      .eq("import_batch_id", batchId)
      .eq("row_number", row.rowNumber);
  }

  const importedCount = results.filter((row) => row.status === "imported").length;
  const failedCount = results.filter((row) => row.status === "failed").length;

  await client
    .from("import_batches")
    .update({
      status: failedCount ? "failed" : "confirmed",
      confirmed_at: new Date().toISOString(),
      imported_at: new Date().toISOString(),
      valid_rows: importedCount,
      invalid_rows: results.filter((row) => ["invalid", "failed"].includes(row.status)).length,
    })
    .eq("id", batchId);

  return results;
}

async function insertTargetRow(client: AppSupabaseClient, target: ImportTarget, payload: Record<string, unknown>) {
  return client.from(target).insert(payload).select("id").single();
}
