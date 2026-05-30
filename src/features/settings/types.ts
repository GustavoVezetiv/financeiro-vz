import type { Profile } from "@/lib/supabase/types";

export type ProfileRow = Profile;

export type SettingsFormValues = {
  display_name: string;
  currency: string;
  timezone: string;
  month_start_day: string;
  allow_quick_table_edit: boolean;
};

export const currencyOptions = [
  { value: "BRL", label: "Real brasileiro (BRL)" },
  { value: "USD", label: "Dólar americano (USD)" },
  { value: "EUR", label: "Euro (EUR)" },
];

export const timezoneOptions = [
  { value: "America/Cuiaba", label: "America/Cuiaba" },
  { value: "America/Sao_Paulo", label: "America/Sao_Paulo" },
  { value: "America/Manaus", label: "America/Manaus" },
  { value: "America/Fortaleza", label: "America/Fortaleza" },
];

export function profileToFormValues(profile: ProfileRow | null): SettingsFormValues {
  return {
    display_name: profile?.display_name ?? "",
    currency: profile?.currency ?? "BRL",
    timezone: profile?.timezone ?? "America/Cuiaba",
    month_start_day: String(profile?.month_start_day ?? 1),
    allow_quick_table_edit: profile?.allow_quick_table_edit ?? false,
  };
}
