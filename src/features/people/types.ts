import type { Person } from "@/lib/supabase/types";

export type PersonType = "family" | "friend" | "client" | "payer" | "other";

export type PersonFormValues = {
  name: string;
  relationship_type: PersonType;
  email: string;
  phone: string;
  notes: string;
  is_active: boolean;
};

export type PersonRow = Person;

export const emptyPersonForm: PersonFormValues = {
  name: "",
  relationship_type: "other",
  email: "",
  phone: "",
  notes: "",
  is_active: true,
};

export function personToFormValues(person: PersonRow): PersonFormValues {
  return {
    name: person.name,
    relationship_type: person.relationship_type as PersonType,
    email: person.email ?? "",
    phone: person.phone ?? "",
    notes: person.notes ?? "",
    is_active: person.is_active,
  };
}

