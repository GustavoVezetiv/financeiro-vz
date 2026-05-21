import type {
  Category,
  CreditCard,
  CreditCardInvoice,
  CreditCardTransaction,
  OwnershipType,
  Person,
} from "@/lib/supabase/types";

export type TransactionRow = CreditCardTransaction;
export type TransactionCard = Pick<CreditCard, "id" | "name">;
export type TransactionInvoice = Pick<CreditCardInvoice, "id" | "credit_card_id" | "reference_month" | "due_date">;
export type TransactionCategory = Pick<Category, "id" | "name" | "type">;
export type TransactionPerson = Pick<Person, "id" | "name">;

export type TransactionFormValues = {
  credit_card_id: string;
  invoice_id: string;
  transaction_date: string;
  description: string;
  amount: string;
  category_id: string;
  person_id: string;
  ownership_type: OwnershipType;
  installment_number: string;
  installment_total: string;
  is_reimbursable: boolean;
  notes: string;
  create_reimbursement: boolean;
  reimbursement_expected_date: string;
};

export const emptyTransactionForm: TransactionFormValues = {
  credit_card_id: "",
  invoice_id: "",
  transaction_date: "",
  description: "",
  amount: "0",
  category_id: "",
  person_id: "",
  ownership_type: "personal",
  installment_number: "",
  installment_total: "",
  is_reimbursable: false,
  notes: "",
  create_reimbursement: false,
  reimbursement_expected_date: "",
};

export function transactionToFormValues(transaction: TransactionRow): TransactionFormValues {
  return {
    credit_card_id: transaction.credit_card_id,
    invoice_id: transaction.invoice_id ?? "",
    transaction_date: transaction.transaction_date,
    description: transaction.description,
    amount: String(transaction.amount),
    category_id: transaction.category_id ?? "",
    person_id: transaction.person_id ?? "",
    ownership_type: transaction.ownership_type,
    installment_number: transaction.installment_number ? String(transaction.installment_number) : "",
    installment_total: transaction.installment_total ? String(transaction.installment_total) : "",
    is_reimbursable: transaction.is_reimbursable,
    notes: transaction.notes ?? "",
    create_reimbursement: false,
    reimbursement_expected_date: "",
  };
}
