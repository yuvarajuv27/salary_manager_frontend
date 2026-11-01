const JPY = "JPY";

/** Converts a major-unit gross the user typed into API minor units. */
export function grossMajorToMinor(major: number, currency: string): number {
  if (currency === JPY) {
    return Math.round(major);
  }
  return Math.round(major * 100);
}
