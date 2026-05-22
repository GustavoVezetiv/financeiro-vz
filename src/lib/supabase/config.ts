export type SupabaseConfig = {
  url: string;
  anonKey: string;
};

export function getSupabaseConfig(): SupabaseConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return { url, anonKey };
}

export function isSupabaseConfigured() {
  return Boolean(getSupabaseConfig());
}

export function getSiteUrl() {
  const explicitSiteUrl = normalizeUrl(process.env.NEXT_PUBLIC_SITE_URL);

  if (explicitSiteUrl) {
    return explicitSiteUrl;
  }

  const vercelUrl = normalizeUrl(process.env.NEXT_PUBLIC_VERCEL_URL);

  if (vercelUrl) {
    return vercelUrl;
  }

  return "http://localhost:3000";
}

export function getAuthRedirectUrl(path = "/login") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${getSiteUrl()}${normalizedPath}`;
}

function normalizeUrl(value: string | undefined) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim().replace(/\/+$/, "");

  if (!trimmed) {
    return null;
  }

  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}
