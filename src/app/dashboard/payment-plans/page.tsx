import { PaymentPlansCrud } from "@/features/payment-plans/components/payment-plans-crud";

export const metadata = {
  title: "Plano de pagamento",
};

export default function PaymentPlansPage() {
  return <PaymentPlansCrud />;
}
