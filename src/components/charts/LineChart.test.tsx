import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import LineChart from "./LineChart";

vi.mock("react-chartjs-2", () => ({
  Line: (props: { data: { datasets: Array<{ label: string }> } }) => (
    <div data-testid="chartjs-line">
      {props.data.datasets.map((dataset) => (
        <span key={dataset.label}>{dataset.label}</span>
      ))}
    </div>
  ),
}));

describe("LineChart", () => {
  it("renders a Chart.js line chart with gross, net, and employer cost series", () => {
    render(
      <LineChart
        series={[
          {
            month_on: "2026-01-01",
            gross_minor: 10_000_00,
            net_minor: 8_000_00,
            employer_cost_minor: 11_000_00,
          },
          {
            month_on: "2026-02-01",
            gross_minor: 12_000_00,
            net_minor: 9_000_00,
            employer_cost_minor: 13_000_00,
          },
        ]}
        currency="USD"
      />,
    );

    expect(screen.getByRole("img", { name: /monthly totals/i })).toBeInTheDocument();
    expect(screen.getByTestId("chartjs-line")).toBeInTheDocument();
    expect(screen.getByText("Gross")).toBeInTheDocument();
    expect(screen.getByText("Net")).toBeInTheDocument();
    expect(screen.getByText("Employer cost")).toBeInTheDocument();
  });
});
