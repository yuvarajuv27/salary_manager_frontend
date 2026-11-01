import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import type { AnalyticsSeriesRow } from "../../types/api";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
);

type LineChartProps = {
  series: AnalyticsSeriesRow[];
  currency: string;
};

function formatMonthLabel(monthOn: string): string {
  const date = new Date(`${monthOn}T12:00:00`);
  return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

export default function LineChart({ series }: LineChartProps) {
  const labels = series.map((row) => formatMonthLabel(row.month_on));

  return (
    <figure>
      <div className="h-64 w-full" role="img" aria-label="Monthly totals line chart">
        <Line
          data={{
            labels,
            datasets: [
              {
                label: "Gross",
                data: series.map((row) => row.gross_minor),
                borderColor: "oklch(0.48 0.09 195)",
                backgroundColor: "oklch(0.48 0.09 195 / 0.15)",
                tension: 0.25,
              },
              {
                label: "Net",
                data: series.map((row) => row.net_minor),
                borderColor: "oklch(0.5 0.08 230)",
                tension: 0.25,
              },
              {
                label: "Employer cost",
                data: series.map((row) => row.employer_cost_minor),
                borderColor: "oklch(0.55 0.07 160)",
                tension: 0.25,
              },
            ],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: "bottom" },
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  callback: (value) =>
                    typeof value === "number" ? value.toLocaleString() : value,
                },
              },
            },
          }}
        />
      </div>
    </figure>
  );
}
