export function fieldErrors(errors: unknown, field: string): string[] {
  if (
    typeof errors === "object" &&
    errors !== null &&
    field in errors &&
    Array.isArray((errors as Record<string, unknown>)[field])
  ) {
    return (errors as Record<string, string[]>)[field];
  }
  return [];
}
