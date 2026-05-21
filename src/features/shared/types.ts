import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/types";

export type AppSupabaseClient = SupabaseClient<Database>;

export type SelectOption = {
  value: string;
  label: string;
};

export type FeedbackState = {
  type: "success" | "error";
  message: string;
} | null;

