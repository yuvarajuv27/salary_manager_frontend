import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router";
import RulesPage from "./RulesPage";
import { renderWithProviders } from "../test/renderWithProviders";
import { formatMinor } from "../lib/money";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const sessionAdmin = {
  user: {
    id: 1,
    name: "Jane Admin",
    email: "jane@example.com",
    access_role: "admin" as const,
    entity_id: null,
  },
  company: { id: 1, has_entity: true },
};

const entity = {
  id: 5,
  name: "US Ops",
  country: "United States",
  currency: "USD",
};

const savedRules = [
  {
    id: 1,
    entity_id: 5,
    name: "Tax",
    position: 0,
    side: "employee_deduction",
    kind: "percent",
    percent: "10.0000",
    amount_minor: null,
    ceiling_minor: null,
  },
];

const previewResponse = {
  earnings: [],
  deductions: [
    {
      position: 0,
      name: "Edited Tax",
      side: "employee_deduction",
      kind: "percent",
      percent: "10.0000",
      amount_minor: null,
      ceiling_minor: null,
      computed_minor: 100_000,
    },
  ],
  employer_contributions: [],
  net_minor: 900_000,
  employer_cost_minor: 1_000_000,
};

describe("RulesPage", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts unsaved rule edits and typed gross to preview and renders API amounts", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.mocked(fetch);

    fetchMock.mockImplementation((input, init) => {
      const url = String(input);
      if (url.endsWith("/session") && !init?.method) {
        return Promise.resolve(jsonResponse(sessionAdmin));
      }
      if (url.endsWith("/entities/5/pay_rules/preview") && init?.method === "POST") {
        return Promise.resolve(jsonResponse(previewResponse));
      }
      if (url.endsWith("/entities/5/pay_rules") && !init?.method) {
        return Promise.resolve(jsonResponse(savedRules));
      }
      if (url.endsWith("/entities/5") && !init?.method) {
        return Promise.resolve(jsonResponse(entity));
      }
      return Promise.resolve(jsonResponse({}));
    });

    renderWithProviders(
      <Routes>
        <Route path="/entities/:id/rules" element={<RulesPage />} />
      </Routes>,
      { route: "/entities/5/rules" },
    );

    await screen.findByDisplayValue("Tax");

    await user.clear(screen.getByLabelText(/rule name for position 0/i));
    await user.type(screen.getByLabelText(/rule name for position 0/i), "Edited Tax");
    await user.clear(screen.getByLabelText(/preview gross/i));
    await user.type(screen.getByLabelText(/preview gross/i), "10000");

    await waitFor(() => {
      const previewCalls = fetchMock.mock.calls.filter(
        ([url, init]) =>
          String(url).endsWith("/entities/5/pay_rules/preview") &&
          init?.method === "POST",
      );
      const finalCall = previewCalls.at(-1);
      expect(finalCall).toBeDefined();
      const body = JSON.parse(String(finalCall?.[1]?.body));
      expect(body.gross_minor).toBe(1_000_000);
      expect(body.rules[0].name).toBe("Edited Tax");
    });

    await waitFor(() => {
      expect(screen.getByText(/^Net:/)).toHaveTextContent(
        `Net: ${formatMinor(previewResponse.net_minor, "USD")}`,
      );
      expect(screen.getByText(/^Employer cost:/)).toHaveTextContent(
        `Employer cost: ${formatMinor(previewResponse.employer_cost_minor, "USD")}`,
      );
      expect(screen.getByText(/Edited Tax:/)).toHaveTextContent(
        `Edited Tax: ${formatMinor(100_000, "USD")}`,
      );
    });
  });
});
