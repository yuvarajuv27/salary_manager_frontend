import { describe, it, expect } from "vitest";
import { formatMinor } from "./money";

describe("formatMinor", () => {
  it("formats JPY with no decimals and currency code", () => {
    expect(formatMinor(1234, "JPY")).toBe("1,234 JPY");
  });
  it("formats USD with two decimals and currency code", () => {
    expect(formatMinor(12345, "USD")).toBe("123.45 USD");
  });
});
