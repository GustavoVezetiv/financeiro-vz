import * as XLSX from "xlsx";

import type { RawImportRow } from "@/features/imports/types";

export async function parseSpreadsheetFile(file: File): Promise<RawImportRow[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", raw: false, cellDates: false });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, {
    defval: "",
    raw: false,
  });

  return rows
    .map((row) =>
      Object.fromEntries(
        Object.entries(row).map(([key, value]) => [normalizeHeader(key), String(value ?? "").trim()]),
      ),
    )
    .filter((row) => Object.values(row).some((value) => value.trim() !== ""));
}

function normalizeHeader(value: string) {
  return value.trim().toLowerCase();
}
