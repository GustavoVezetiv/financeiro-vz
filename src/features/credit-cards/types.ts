import type { CreditCard } from "@/lib/supabase/types";

export type CreditCardFormValues = {
  name: string;
  issuer: string;
  brand: string;
  closing_day: string;
  due_day: string;
  limit_amount: string;
  is_active: boolean;
  notes: string;
};

export type CreditCardRow = CreditCard;

export const emptyCreditCardForm: CreditCardFormValues = {
  name: "",
  issuer: "",
  brand: "",
  closing_day: "",
  due_day: "",
  limit_amount: "0",
  is_active: true,
  notes: "",
};

export function creditCardToFormValues(card: CreditCardRow): CreditCardFormValues {
  return {
    name: card.name,
    issuer: card.issuer ?? "",
    brand: card.brand ?? "",
    closing_day: card.closing_day ? String(card.closing_day) : "",
    due_day: card.due_day ? String(card.due_day) : "",
    limit_amount: card.limit_amount ? String(card.limit_amount) : "0",
    is_active: card.is_active,
    notes: card.notes ?? "",
  };
}

