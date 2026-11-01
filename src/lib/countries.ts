export const COUNTRIES = [
  "India",
  "United States",
  "United Kingdom",
  "Canada",
  "Japan",
  "Australia",
  "Singapore",
  "Portugal",
  "France",
] as const;

export type Country = (typeof COUNTRIES)[number];
