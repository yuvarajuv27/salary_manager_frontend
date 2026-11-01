import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router";
import AppShell from "./layout/AppShell";
import AnalyticsPage from "../pages/AnalyticsPage";
import {
  renderWithProviders,
  createTestQueryClient,
} from "../test/renderWithProviders";
import { sessionQueryKey } from "../hooks/useSession";
import { ENTITY_CONTEXT_STORAGE_KEY } from "../hooks/entityContext";

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

const entities = [
  { id: 5, name: "US Ops", country: "United States", currency: "USD" },
  { id: 9, name: "India Ops", country: "India", currency: "INR" },
];

describe("AppShell navigation", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo) => {
        const url = String(input);
        if (url.includes("/entities") && !url.includes("/payroll_runs")) {
          return Promise.resolve(jsonResponse(entities));
        }
        if (url.includes("/payroll_runs")) {
          return Promise.resolve(
            jsonResponse([{ month_on: "2026-03-01", payroll_on: "2026-03-31", status: "credited" }]),
          );
        }
        if (url.includes("/analytics")) {
          return Promise.resolve(
            jsonResponse({
              months: [],
              employer_cost_by_entity: [],
              pending_entity_names: [],
            }),
          );
        }
        return Promise.resolve(jsonResponse(adminSession));
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function renderShell(
    session: typeof adminSession | typeof hrSession,
    route = "/",
  ) {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(sessionQueryKey, session);
    return renderWithProviders(
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<AnalyticsPage />} />
          <Route path="/entities" element={<div>Entities list</div>} />
          <Route path="/entities/:id" element={<div>Entity home</div>} />
          <Route
            path="/entities/:id/employees"
            element={<div>Employees</div>}
          />
          <Route path="/entities/:id/rules" element={<div>Rules</div>} />
          <Route
            path="/entities/:id/analytics"
            element={<div>Entity analytics</div>}
          />
          <Route
            path="/entities/:id/payroll/:month"
            element={<div>Payroll month</div>}
          />
        </Route>
      </Routes>,
      { route, queryClient },
    );
  }

  it("renders sidebar shell with product name and sign out", () => {
    renderShell(adminSession);
    expect(screen.getByText("Salary Manager")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Main" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
  });

  it("shows company, users, and account links for admin", () => {
    renderShell(adminSession);
    expect(screen.getByRole("link", { name: "Account" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Company" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Users" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Entities" })).toBeInTheDocument();
  });

  it("omits company, users, and account links for HR", () => {
    renderShell(hrSession);
    expect(screen.getByRole("link", { name: "Analytics" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Entities" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Company" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Users" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Account" })).not.toBeInTheDocument();
  });

  it("shows an entity switcher for admin", async () => {
    renderShell(adminSession);
    expect(
      await screen.findByRole("combobox", { name: "Entity" }),
    ).toBeInTheDocument();
  });

  it("hides the entity switcher for HR", () => {
    renderShell(hrSession);
    expect(
      screen.queryByRole("combobox", { name: "Entity" }),
    ).not.toBeInTheDocument();
  });

  it("lets admin select an entity and shows entity nav links", async () => {
    const user = userEvent.setup();
    renderShell(adminSession);

    const switcher = await screen.findByRole("combobox", { name: "Entity" });
    await waitFor(() => {
      expect(within(switcher).getByRole("option", { name: "US Ops" })).toBeInTheDocument();
    });
    await user.selectOptions(switcher, "5");

    expect(sessionStorage.getItem(ENTITY_CONTEXT_STORAGE_KEY)).toBe("5");

    const nav = screen.getByRole("navigation", { name: "Main" });
    expect(
      within(nav).getByRole("link", { name: "Employees" }),
    ).toHaveAttribute("href", "/entities/5/employees");
    expect(within(nav).getByRole("link", { name: "Pay rules" })).toHaveAttribute(
      "href",
      "/entities/5/rules",
    );
    expect(
      within(nav).getByRole("link", { name: "Entity analytics" }),
    ).toHaveAttribute("href", "/entities/5/analytics");
  });

  it("syncs entity switcher from the URL", async () => {
    renderShell(adminSession, "/entities/9/employees");
    const switcher = await screen.findByRole("combobox", { name: "Entity" });
    await waitFor(() => expect(switcher).toHaveValue("9"));
  });

  it("shows entity nav for HR using their assigned entity", () => {
    renderShell(hrSession, "/");
    const nav = screen.getByRole("navigation", { name: "Main" });
    expect(
      within(nav).getByRole("link", { name: "Employees" }),
    ).toHaveAttribute("href", "/entities/5/employees");
  });

  it("clears entity context when admin chooses all entities", async () => {
    const user = userEvent.setup();
    sessionStorage.setItem(ENTITY_CONTEXT_STORAGE_KEY, "5");
    renderShell(adminSession, "/entities/5");

    const switcher = await screen.findByRole("combobox", { name: "Entity" });
    await user.selectOptions(switcher, "");

    expect(sessionStorage.getItem(ENTITY_CONTEXT_STORAGE_KEY)).toBeNull();
    expect(screen.getByText("Entities list")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Employees" }),
    ).not.toBeInTheDocument();
  });
});
