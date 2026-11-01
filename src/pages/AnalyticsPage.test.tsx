import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { Route, Routes } from "react-router";
import AnalyticsPage from "./AnalyticsPage";
import {
  renderWithProviders,
  createTestQueryClient,
} from "../test/renderWithProviders";
import { sessionQueryKey } from "../hooks/useSession";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const adminSession = {
  user: {
    id: 1,
    name: "Jane Admin",
    email: "jane@example.com",
    access_role: "admin" as const,
    entity_id: null,
  },
  company: { id: 1, has_entity: true },
};

const hrSession = {
  user: {
    id: 2,
    name: "Sam HR",
    email: "sam@example.com",
    access_role: "hr" as const,
    entity_id: 5,
  },
  company: { id: 1, has_entity: true },
};

describe("AnalyticsPage", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function renderPage(session: typeof adminSession | typeof hrSession) {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(sessionQueryKey, session);
    return renderWithProviders(
      <Routes>
        <Route path="/" element={<AnalyticsPage />} />
      </Routes>,
      { route: "/", queryClient },
    );
  }

  it("loads account analytics for admin and shows empty state", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockImplementation((input) => {
      const url = String(input);
      if (url.endsWith("/session")) {
        return Promise.resolve(jsonResponse(adminSession));
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
      return Promise.resolve(jsonResponse({}));
    });

    renderPage(adminSession);

    await waitFor(() => {
      expect(screen.getByText("Nothing to chart yet.")).toBeInTheDocument();
    });
  });

  it("loads entity analytics for HR", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockImplementation((input) => {
      const url = String(input);
      if (url.endsWith("/session")) {
        return Promise.resolve(jsonResponse(hrSession));
      }
      if (url.endsWith("/entities/5/analytics")) {
        return Promise.resolve(
          jsonResponse({
            currency: "USD",
            empty: true,
            latest: null,
            series: [],
            rule_totals: [],
          }),
        );
      }
      return Promise.resolve(jsonResponse({}));
    });

    renderPage(hrSession);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/entities/5/analytics"),
        expect.anything(),
      );
    });
  });

  it("lists pending entity names on account analytics", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockImplementation((input) => {
      const url = String(input);
      if (url.endsWith("/session")) {
        return Promise.resolve(jsonResponse(adminSession));
      }
      if (url.endsWith("/analytics")) {
        return Promise.resolve(
          jsonResponse({
            currency: "USD",
            empty: false,
            latest: {
              month_on: "2026-03-01",
              headcount: 1,
              gross_minor: 5_000_00,
              net_minor: 4_500_00,
              employer_cost_minor: 5_500_00,
            },
            series: [
              {
                month_on: "2026-03-01",
                gross_minor: 5_000_00,
                net_minor: 4_500_00,
                employer_cost_minor: 5_500_00,
              },
            ],
            rule_totals: [],
            employer_cost_by_entity: [
              {
                entity_id: 1,
                name: "US Ops",
                employer_cost_minor: 5_500_00,
              },
            ],
            pending_entity_names: ["Canada Ltd"],
          }),
        );
      }
      return Promise.resolve(jsonResponse({}));
    });

    renderPage(adminSession);

    await waitFor(() => {
      expect(screen.getByText("Canada Ltd")).toBeInTheDocument();
    });
    expect(screen.getByText("Pending conversion")).toBeInTheDocument();
  });
});
