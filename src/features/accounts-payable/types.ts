import type { AccountPayable, Category, Person, RiskLevel } from "@/lib/supabase/types";

export type AccountPayableFormValues = {
  title: string;
  description: string;
  amount: string;
  due_date: string;
  category_id: string;
  person_id: string;
  priority: string;
  status: string;
  payment_method_planned: string;
  can_delay: boolean;
  delay_risk: RiskLevel;
  notes: string;
};

export type AccountPayableRow = AccountPayable;
export type AccountCategory = Pick<Category, "id" | "name" | "type" | "color" | "icon">;
export type AccountPerson = Pick<Person, "id" | "name">;

export const emptyAccountForm: AccountPayableFormValues = {
  title: "",
  description: "",
  amount: "0",
  due_date: "",
  category_id: "",
  person_id: "",
  priority: "medium",
  status: "pending",
  payment_method_planned: "unknown",
  can_delay: false,
  delay_risk: "medium",
  notes: "",
};

export function accountToFormValues(account: AccountPayableRow): AccountPayableFormValues {
  return {
    title: account.title,
    description: account.description ?? "",
    amount: String(account.amount),
    due_date: account.due_date,
    category_id: account.category_id ?? "",
    person_id: account.person_id ?? "",
    priority: account.priority,
    status: account.status,
    payment_method_planned: account.payment_method_planned,
    can_delay: account.can_delay,
    delay_risk: account.delay_risk,
    notes: account.notes ?? "",
  };
}
