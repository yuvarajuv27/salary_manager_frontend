import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  Title,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import type { EmployerCostByEntity } from "../../types/api";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend, Title);

type BarChartProps = {
  bars: EmployerCostByEntity[];
  currency: string;
};

export default function BarChart({ bars }: BarChartProps) {
  return (
    <figure>
      <div
        className="h-64 w-full"
        role="img"
        aria-label="Employer cost by entity bar chart"
      >
        <Bar
          data={{
            labels: bars.map((bar) => bar.name),
            datasets: [
              {
                label: "Employer cost",
                data: bars.map((bar) => bar.employer_cost_minor),
                backgroundColor: "oklch(0.48 0.09 195 / 0.75)",
              },
            ],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              title: {
                display: true,
                text: "Employer cost by entity (latest month)",
              },
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
      <figcaption className="sr-only">
        Employer cost by entity (latest month)
      </figcaption>
    </figure>
  );
}
