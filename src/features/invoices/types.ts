import type {
  CreditCard,
  CreditCardInvoice,
  CreditCardTransaction,
  InvoicePaymentStatus,
  Reimbursement,
} from "@/lib/supabase/types";

export type InvoiceFormValues = {
  credit_card_id: string;
  reference_month: string;
  closing_date: string;
  due_date: string;
  total_amount: string;
  paid_amount: string;
  status: InvoicePaymentStatus;
  notes: string;
};

export type InvoiceRow = CreditCardInvoice;
export type InvoiceCard = Pick<CreditCard, "id" | "name" | "issuer" | "closing_day" | "due_day">;

export type InvoiceTransactionRow = CreditCardTransaction;
export type InvoiceReimbursementRow = Reimbursement;

export const emptyInvoiceForm: InvoiceFormValues = {
  credit_card_id: "",
  reference_month: "",
  closing_date: "",
  due_date: "",
  total_amount: "0",
  paid_amount: "0",
  status: "open",
  notes: "",
};

export function invoiceToFormValues(invoice: InvoiceRow): InvoiceFormValues {
  return {
    credit_card_id: invoice.credit_card_id,
    reference_month: invoice.reference_month,
    closing_date: invoice.closing_date ?? "",
    due_date: invoice.due_date,
    total_amount: String(invoice.total_amount),
    paid_amount: String(invoice.paid_amount),
    status: invoice.status,
    notes: invoice.notes ?? "",
  };
}

export function calculateInvoiceSummary(
  invoice: InvoiceRow,
  transactions: InvoiceTransactionRow[],
  reimbursements: InvoiceReimbursementRow[],
) {
  const transactionTotal = transactions.reduce((sum, tx) => sum + Number(tx.amount), 0);
  const expectedReimbursements = reimbursements.reduce(
    (sum, item) => sum + Number(item.expected_amount),
    0,
  );
  const receivedReimbursements = reimbursements.reduce(
    (sum, item) => sum + Number(item.received_amount),
    0,
  );

  return {
    invoiceTotal: Number(invoice.total_amount || transactionTotal),
    paidAmount: Number(invoice.paid_amount),
    pendingAmount: Math.max(Number(invoice.total_amount || transactionTotal) - Number(invoice.paid_amount), 0),
    reimbursableAmount: transactions
      .filter((tx) => tx.is_reimbursable)
      .reduce((sum, tx) => sum + Number(tx.amount), 0),
    expectedReimbursements,
    receivedReimbursements,
    netPersonalCost: Math.max(transactionTotal - expectedReimbursements, 0),
    transactionTotal,
  };
}
