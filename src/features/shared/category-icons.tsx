"use client";

import {
  BriefcaseBusiness,
  Car,
  CircleEllipsis,
  Clapperboard,
  CreditCard,
  GraduationCap,
  HeartPulse,
  Home,
  Plane,
  ReceiptText,
  ShoppingBasket,
  Soup,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

export type CategoryIconOption = {
  value: string;
  label: string;
  Icon: LucideIcon;
};

export const categoryIconOptions: CategoryIconOption[] = [
  { value: "casa", label: "Casa", Icon: Home },
  { value: "carro", label: "Carro", Icon: Car },
  { value: "cartao", label: "Cartão", Icon: CreditCard },
  { value: "comida", label: "Comida", Icon: Soup },
  { value: "mercado", label: "Mercado", Icon: ShoppingBasket },
  { value: "saude", label: "Saúde", Icon: HeartPulse },
  { value: "estudo", label: "Estudo", Icon: GraduationCap },
  { value: "trabalho", label: "Trabalho", Icon: BriefcaseBusiness },
  { value: "lazer", label: "Lazer", Icon: Clapperboard },
  { value: "assinatura", label: "Assinatura", Icon: ReceiptText },
  { value: "familia", label: "Família", Icon: UsersRound },
  { value: "viagem", label: "Viagem", Icon: Plane },
  { value: "outros", label: "Outros", Icon: CircleEllipsis },
];

export function CategoryIcon({ value, className = "h-4 w-4" }: { value?: string | null; className?: string }) {
  const normalized = value?.trim();
  const option = categoryIconOptions.find((item) => item.value === normalized);

  if (option) {
    const Icon = option.Icon;
    return <Icon aria-hidden="true" className={className} strokeWidth={2} />;
  }

  if (normalized) {
    return <span aria-hidden="true" className="inline-flex min-w-4 justify-center text-sm leading-none">{normalized}</span>;
  }

  return null;
}
