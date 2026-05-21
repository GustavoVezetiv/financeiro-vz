import { InvoiceTransactionsCrud } from "@/features/transactions/components/invoice-transactions-crud";

export const metadata = {
  title: "Lançamentos da fatura",
};

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <InvoiceTransactionsCrud invoiceId={id} />;
}
