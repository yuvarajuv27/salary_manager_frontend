import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { Route, Routes } from "react-router";
import PayrollMonthPage from "./PayrollMonthPage";
import { renderWithProviders } from "../test/renderWithProviders";
import { formatMinor } from "../lib/money";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const entity = {
  id: 5,
  name: "US Ops",
  country: "United States",
  currency: "USD",
};

const monthResponse = {
  month_on: "2026-03-01",
  payroll_on: "2026-03-31",
  status: "credited",
  entries: [
    {
      type: "payslip",
      payslip_id: 42,
      employee_id: 1,
      employee_name: "Alex",
      gross_minor: 5_000_00,
      net_minor: 4_500_00,
      employer_cost_minor: 5_500_00,
    },
    {
      type: "skip",
      employee_id: 2,
      employee_name: "Sam",
      reason: "monthly_salary_unset",
    },
  ],
};

describe("PayrollMonthPage", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads the month list, links payslips, and shows skip reason without a detail link", async () => {
    const fetchMock = vi.mocked(fetch);

    fetchMock.mockImplementation((input, init) => {
      const url = String(input);
      if (url.endsWith("/entities/5/payroll_runs/2026-03-01") && !init?.method) {
        return Promise.resolve(jsonResponse(monthResponse));
      }
      if (url.endsWith("/entities/5") && !init?.method) {
        return Promise.resolve(jsonResponse(entity));
      }
      return Promise.resolve(jsonResponse({}));
    });

    renderWithProviders(
      <Routes>
        <Route
          path="/entities/:id/payroll/:month"
          element={<PayrollMonthPage />}
        />
      </Routes>,
      { route: "/entities/5/payroll/2026-03-01" },
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/entities/5/payroll_runs/2026-03-01"),
        expect.objectContaining({ credentials: "include" }),
      );
    });

    const alexLink = await screen.findByRole("link", { name: "Alex" });
    expect(alexLink).toHaveAttribute(
      "href",
      "/entities/5/payroll/2026-03-01/42",
    );
    expect(screen.getByText(/monthly_salary_unset/)).toBeInTheDocument();
    expect(
      screen.getByText(formatMinor(5_000_00, "USD"), { exact: false }),
    ).toBeInTheDocument();

    const samItem = screen.getByText(/Sam — skipped/).closest("tr");
    expect(samItem).not.toBeNull();
    expect(samItem?.querySelector("a")).toBeNull();
  });
});
