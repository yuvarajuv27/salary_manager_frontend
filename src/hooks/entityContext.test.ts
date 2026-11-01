import { describe, it, expect, beforeEach } from "vitest";
import {
  ENTITY_CONTEXT_STORAGE_KEY,
  parseEntityIdFromPath,
  readStoredEntityId,
  writeStoredEntityId,
} from "./entityContext";

describe("parseEntityIdFromPath", () => {
  it("reads entity id from entity routes", () => {
    expect(parseEntityIdFromPath("/entities/12")).toBe(12);
    expect(parseEntityIdFromPath("/entities/12/employees")).toBe(12);
    expect(parseEntityIdFromPath("/entities/12/payroll/2026-03-01")).toBe(12);
  });

  it("returns null outside entity routes", () => {
    expect(parseEntityIdFromPath("/")).toBeNull();
    expect(parseEntityIdFromPath("/entities")).toBeNull();
    expect(parseEntityIdFromPath("/company")).toBeNull();
  });
});

describe("entity context sessionStorage", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("round-trips a stored entity id", () => {
    writeStoredEntityId(7);
    expect(sessionStorage.getItem(ENTITY_CONTEXT_STORAGE_KEY)).toBe("7");
    expect(readStoredEntityId()).toBe(7);
  });

  it("clears storage when id is null", () => {
    writeStoredEntityId(7);
    writeStoredEntityId(null);
    expect(sessionStorage.getItem(ENTITY_CONTEXT_STORAGE_KEY)).toBeNull();
    expect(readStoredEntityId()).toBeNull();
  });
});
