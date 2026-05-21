import { PaymentPlanDetail } from "@/features/payment-plans/components/payment-plan-detail";

export const metadata = {
  title: "Detalhe do plano",
};

export default async function PaymentPlanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <PaymentPlanDetail planId={id} />;
}
