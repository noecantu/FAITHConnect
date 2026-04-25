type MaybeError = {
  code?: string;
  message?: string;
  details?: string | null;
  hint?: string | null;
};

export function isMissingTableError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  const maybe = error as MaybeError;
  const code = String(maybe.code ?? "").toUpperCase();
  const message = String(maybe.message ?? "").toLowerCase();

  return (
    code === "PGRST205" ||
    code === "42P01" ||
    message.includes("schema cache") ||
    message.includes("could not find the table") ||
    message.includes("relation")
  );
}

export function schemaNotInitializedResponse(tableName: string) {
  return {
    error: `Database schema is not initialized. Missing table: public.${tableName}. Run supabase-schema.sql in the Supabase SQL Editor for this project.`,
    code: "SCHEMA_NOT_INITIALIZED",
    missingTable: `public.${tableName}`,
  };
}
