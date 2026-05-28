import type { SettingsFormValues } from "@/features/settings/types";
import type { AppSupabaseClient } from "@/features/shared/types";
import type { Profile } from "@/lib/supabase/types";

export async function getProfile(client: AppSupabaseClient, userId: string) {
  return client.from("profiles").select("*").eq("id", userId).maybeSingle();
}

export async function upsertProfile(client: AppSupabaseClient, userId: string, values: SettingsFormValues) {
  const payload: Partial<Profile> = {
    id: userId,
    user_id: userId,
    display_name: values.display_name.trim() || null,
    currency: values.currency,
    timezone: values.timezone,
    month_start_day: Number(values.month_start_day || 1),
  };

  return client.from("profiles").upsert(payload).select("*").single();
}
