import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import App from "./App";
import { renderWithProviders } from "./test/renderWithProviders";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const sessionNoEntity = {
  user: {
    id: 1,
    name: "Jane Admin",
    email: "jane@example.com",
    access_role: "admin" as const,
    entity_id: null,
  },
  company: { id: 1, has_entity: false },
};

describe("App route guards", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(jsonResponse(sessionNoEntity))),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends an admin with no entity to onboarding from the home route", async () => {
    renderWithProviders(<App />, { route: "/" });

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Onboarding" })).toBeInTheDocument();
    });
  });
});
