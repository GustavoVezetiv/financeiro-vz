import type { Category, FinancialInflowKind, IncomeSource, Person } from "@/lib/supabase/types";

export type IncomeSourceFormValues = {
  source: string;
  description: string;
  amount: string;
  expected_date: string;
  received_date: string;
  category_id: string;
  person_id: string;
  type: string;
  confidence: string;
  status: string;
  notes: string;
};

export type IncomeSourceRow = IncomeSource;
export type IncomeCategory = Pick<Category, "id" | "name" | "type">;
export type IncomePerson = Pick<Person, "id" | "name">;

export const emptyIncomeForm: IncomeSourceFormValues = {
  source: "",
  description: "",
  amount: "0",
  expected_date: "",
  received_date: "",
  category_id: "",
  person_id: "",
  type: "real_income",
  confidence: "medium",
  status: "expected",
  notes: "",
};

export function incomeToFormValues(income: IncomeSourceRow): IncomeSourceFormValues {
  return {
    source: income.name,
    description: income.description ?? "",
    amount: String(income.amount),
    expected_date: income.expected_date ?? "",
    received_date: income.received_date ?? "",
    category_id: income.category_id ?? "",
    person_id: income.person_id ?? "",
    type: income.source_type,
    confidence: income.confidence,
    status: income.status,
    notes: income.notes ?? "",
  };
}

export function inflowKindFromType(type: string): FinancialInflowKind {
  if (type === "reimbursement") {
    return "reimbursement";
  }

  if (type === "third_party_money") {
    return "third_party_money";
  }

  return "real_income";
}

