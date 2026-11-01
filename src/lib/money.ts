const JPY = "JPY";

export function formatMinor(amountMinor: number, currency: string): string {
  const isJpy = currency === JPY;
  const major = isJpy ? amountMinor : amountMinor / 100;

  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: isJpy ? 0 : 2,
    maximumFractionDigits: isJpy ? 0 : 2,
  });

  const amount = formatter
    .formatToParts(major)
    .filter((part) => part.type !== "currency")
    .map((part) => part.value)
    .join("")
    .trim();

  return `${amount} ${currency}`;
}
