import { type Country, COUNTRIES } from "./countries";

export const COUNTRY_BANK_FIELDS: Record<Country, readonly string[]> = {
  India: ["account_holder_name", "account_number", "ifsc"],
  "United States": ["account_holder_name", "account_number", "routing_number"],
  "United Kingdom": ["account_holder_name", "account_number", "sort_code"],
  Canada: [
    "account_holder_name",
    "account_number",
    "institution_number",
    "transit_number",
  ],
  Japan: ["account_holder_name", "account_number", "bank_code", "branch_code"],
  Australia: ["account_holder_name", "account_number", "bsb"],
  Singapore: ["account_holder_name", "account_number", "bank_code"],
  Portugal: ["account_holder_name", "iban"],
  France: ["account_holder_name", "iban"],
};

const FIELD_LABELS: Record<string, string> = {
  account_holder_name: "Account holder name",
  account_number: "Account number",
  ifsc: "IFSC",
  routing_number: "Routing number",
  sort_code: "Sort code",
  institution_number: "Institution number",
  transit_number: "Transit number",
  bank_code: "Bank code",
  branch_code: "Branch code",
  bsb: "BSB",
  iban: "IBAN",
};

export function bankFieldKeysForCountry(country: string): readonly string[] {
  if (!(COUNTRIES as readonly string[]).includes(country)) {
    throw new Error(`unknown country: ${country}`);
  }
  return COUNTRY_BANK_FIELDS[country as Country];
}

export function bankFieldLabel(key: string): string {
  return FIELD_LABELS[key] ?? key;
}

export function emptyBankDraft(country: string): Record<string, string> {
  return Object.fromEntries(
    bankFieldKeysForCountry(country).map((key) => [key, ""]),
  );
}

export function isBankReadable(
  details: EmployeeBankDetails | null | undefined,
): details is Record<string, string> {
  return (
    details !== null &&
    details !== undefined &&
    !("readable" in details && details.readable === false)
  );
}

export type EmployeeBankDetails =
  | Record<string, string>
  | { readable: false };

export function bankDraftIsComplete(
  country: string,
  draft: Record<string, string>,
): boolean {
  return bankFieldKeysForCountry(country).every(
    (key) => draft[key]?.trim().length > 0,
  );
}
