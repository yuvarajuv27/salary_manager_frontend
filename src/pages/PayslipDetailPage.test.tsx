import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { Route, Routes } from "react-router";
import PayslipDetailPage from "./PayslipDetailPage";
import { renderWithProviders } from "../test/renderWithProviders";
import { formatMinor } from "../lib/money";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const payslip = {
  id: 42,
  employee_id: 1,
  employee_name: "Alex",
  job_role: "Analyst",
  department: "Finance",
  month_on: "2026-03-01",
  payroll_on: "2026-03-31",
  currency: "USD",
  payable_days: 22,
  leave_days_count: 1,
  outside_days: 0,
  salary_minor: 5_000_00,
  gross_minor: 5_000_00,
  net_minor: 4_500_00,
  employer_cost_minor: 5_500_00,
  lines: [
    {
      position: 0,
      name: "Base",
      side: "earning",
      kind: "percent",
      percent: "100.0000",
      amount_minor: null,
      ceiling_minor: null,
      computed_minor: 5_000_00,
    },
    {
      position: 1,
      name: "Tax",
      side: "employee_deduction",
      kind: "percent",
      percent: "10.0000",
      amount_minor: null,
      ceiling_minor: null,
      computed_minor: 500_00,
    },
  ],
};

describe("PayslipDetailPage", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders stored payslip amounts and lines without bank fields", async () => {
    const fetchMock = vi.mocked(fetch);

    fetchMock.mockImplementation((input, init) => {
      const url = String(input);
      if (url.endsWith("/entities/5/payslips/42") && !init?.method) {
        return Promise.resolve(jsonResponse(payslip));
      }
      return Promise.resolve(jsonResponse({}));
    });

    renderWithProviders(
      <Routes>
        <Route
          path="/entities/:id/payroll/:month/:payslipId"
          element={<PayslipDetailPage />}
        />
      </Routes>,
      { route: "/entities/5/payroll/2026-03-01/42" },
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/entities/5/payslips/42"),
        expect.objectContaining({ credentials: "include" }),
      );
    });

    expect(await screen.findByRole("heading", { name: "Alex" })).toBeInTheDocument();
    expect(screen.getByText(/Analyst/)).toBeInTheDocument();
    expect(screen.getByText(/Finance/)).toBeInTheDocument();
    expect(screen.getByText(/Payable days: 22/)).toBeInTheDocument();
    expect(screen.getByText(/^Gross:/)).toHaveTextContent(
      `Gross: ${formatMinor(payslip.gross_minor, "USD")}`,
    );
    expect(screen.getByText(/Base:/)).toHaveTextContent(
      `Base: ${formatMinor(5_000_00, "USD")}`,
    );
    expect(screen.getByText(/Tax:/)).toHaveTextContent(
      `Tax: ${formatMinor(500_00, "USD")}`,
    );
    expect(screen.queryByText(/Account number/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/IBAN/i)).not.toBeInTheDocument();
  });
});
