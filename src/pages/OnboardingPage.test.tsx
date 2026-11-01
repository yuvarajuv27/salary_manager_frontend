import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router";
import OnboardingPage from "./OnboardingPage";
import AnalyticsPage from "./AnalyticsPage";
import { renderWithProviders } from "../test/renderWithProviders";

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

describe("OnboardingPage", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(jsonResponse(sessionNoEntity))),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("creates the first entity and navigates to analytics", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.mocked(fetch);

    fetchMock.mockImplementation((input, init) => {
      const url = String(input);
      if (url.endsWith("/entities") && init?.method === "POST") {
        return Promise.resolve(
          jsonResponse(
            {
              id: 10,
              name: "US Ops",
              country: "United States",
              currency: "USD",
            },
            201,
          ),
        );
      }
      if (url.endsWith("/session") && !init?.method) {
        return Promise.resolve(
          jsonResponse({
            ...sessionNoEntity,
            company: { id: 1, has_entity: true },
          }),
        );
      }
      if (url.endsWith("/analytics")) {
        return Promise.resolve(
          jsonResponse({
            currency: "USD",
            empty: true,
            latest: null,
            series: [],
            rule_totals: [],
            employer_cost_by_entity: [],
            pending_entity_names: [],
          }),
        );
      }
      return Promise.resolve(jsonResponse(sessionNoEntity));
    });

    renderWithProviders(
      <Routes>
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/" element={<AnalyticsPage />} />
      </Routes>,
      { route: "/onboarding" },
    );

    await user.type(screen.getByLabelText(/entity name/i), "US Ops");
    await user.selectOptions(screen.getByLabelText(/country/i), "United States");
    await user.click(screen.getByRole("button", { name: /create entity/i }));

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Account analytics" }),
      ).toBeInTheDocument();
    });

    const createCall = fetchMock.mock.calls.find(
      ([url, init]) =>
        String(url).endsWith("/entities") && init?.method === "POST",
    );
    expect(JSON.parse(String(createCall?.[1]?.body))).toEqual({
      name: "US Ops",
      country: "United States",
    });
  });
});
