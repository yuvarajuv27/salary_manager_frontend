import type { FieldValues, Path, UseFormSetError } from "react-hook-form";

export function apply422Errors<T extends FieldValues>(
  setError: UseFormSetError<T>,
  errors: Record<string, string[]> | unknown,
) {
  if (typeof errors !== "object" || errors === null || Array.isArray(errors)) {
    return;
  }

  for (const [field, messages] of Object.entries(
    errors as Record<string, string[]>,
  )) {
    const message = Array.isArray(messages) ? messages[0] : String(messages);
    if (!message) {
      continue;
    }
    setError(field as Path<T>, { type: "server", message });
  }
}
