export const PRIMARY_CURRENCIES = [
  "INR",
  "USD",
  "GBP",
  "CAD",
  "JPY",
  "AUD",
  "SGD",
  "EUR",
] as const;

export type PrimaryCurrency = (typeof PRIMARY_CURRENCIES)[number];
