function normalizeEnvValue(value: string | undefined): string {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return "";

  const hasWrappingQuotes =
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"));

  return hasWrappingQuotes ? trimmed.slice(1, -1).trim() : trimmed;
}

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function getSupabasePublicEnv() {
  const url = normalizeEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = normalizeEnvValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase public configuration. Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set."
    );
  }

  if (!isValidHttpUrl(url)) {
    throw new Error(
      "Invalid NEXT_PUBLIC_SUPABASE_URL. Check for quotes, spaces, or an incomplete URL in Vercel environment variables."
    );
  }

  return { url, anonKey };
}

export function getSupabaseAdminEnv() {
  const { url } = getSupabasePublicEnv();
  const serviceRoleKey = normalizeEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (!serviceRoleKey) {
    throw new Error(
      "Missing Supabase admin configuration. Ensure SUPABASE_SERVICE_ROLE_KEY is set."
    );
  }

  return { url, serviceRoleKey };
}