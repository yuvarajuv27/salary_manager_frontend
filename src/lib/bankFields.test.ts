import { describe, it, expect } from "vitest";
import {
  bankFieldKeysForCountry,
  bankFieldLabel,
  emptyBankDraft,
} from "./bankFields";

describe("bankFields", () => {
  it("returns US bank field keys in order", () => {
    expect(bankFieldKeysForCountry("United States")).toEqual([
      "account_holder_name",
      "account_number",
      "routing_number",
    ]);
  });

  it("builds an empty draft with every key for the country", () => {
    expect(emptyBankDraft("France")).toEqual({
      account_holder_name: "",
      iban: "",
    });
  });

  it("labels fields for forms", () => {
    expect(bankFieldLabel("ifsc")).toBe("IFSC");
  });
});
