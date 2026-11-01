import { PageHeader } from "@/components/layout/PageHeader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatMinor } from "../lib/money";
import LineChart from "./charts/LineChart";
import BarChart from "./charts/BarChart";
import type {
  AccountAnalyticsResponse,
  AnalyticsRuleTotal,
  EntityAnalyticsResponse,
} from "../types/api";

type AnalyticsContentProps = {
  title: string;
  description?: string;
  data: EntityAnalyticsResponse | AccountAnalyticsResponse;
  headerActions?: React.ReactNode;
  scope: "account" | "entity";
};

function isAccountAnalytics(
  data: EntityAnalyticsResponse | AccountAnalyticsResponse,
): data is AccountAnalyticsResponse {
  return "employer_cost_by_entity" in data;
}

function formatMonthHeading(monthOn: string): string {
  const date = new Date(`${monthOn}T12:00:00`);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function ruleSideLabel(side: AnalyticsRuleTotal["side"]): string {
  return side === "employee_deduction"
    ? "Employee deductions"
    : "Employer contributions";
}

export default function AnalyticsContent({
  title,
  description,
  data,
  headerActions,
  scope,
}: AnalyticsContentProps) {
  if (data.empty) {
    return (
      <>
        <PageHeader title={title} description={description} actions={headerActions} />
        <div className="p-6">
          <Card>
            <CardHeader>
              <CardTitle>No data yet</CardTitle>
              <CardDescription>Nothing to chart yet.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </>
    );
  }

  const latest = data.latest;
  const account =
    scope === "account" && isAccountAnalytics(data) ? data : null;

  const series = data.series ?? [];
  const ruleTotals = data.rule_totals ?? [];

  return (
    <>
      <PageHeader title={title} description={description} actions={headerActions} />
      <div className="space-y-6 p-6">
        {latest ? (
          <Card aria-label="Latest credited month">
            <CardHeader>
              <CardTitle>{formatMonthHeading(latest.month_on)}</CardTitle>
              <CardDescription>
                {scope === "account"
                  ? `Company-wide totals in ${data.currency}`
                  : `Entity totals in ${data.currency}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <dt className="text-sm text-muted-foreground">Headcount</dt>
                  <dd className="text-lg font-semibold tabular-nums">
                    {latest.headcount}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Gross</dt>
                  <dd className="text-lg font-semibold tabular-nums">
                    {formatMinor(latest.gross_minor, data.currency)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Net</dt>
                  <dd className="text-lg font-semibold tabular-nums">
                    {formatMinor(latest.net_minor, data.currency)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">
                    Employer cost
                  </dt>
                  <dd className="text-lg font-semibold tabular-nums">
                    {formatMinor(latest.employer_cost_minor, data.currency)}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        ) : null}

        {series.length > 0 ? (
          <Card aria-label="Monthly trend">
            <CardHeader>
              <CardTitle>Last {series.length} credited months</CardTitle>
            </CardHeader>
            <CardContent>
              <LineChart series={series} currency={data.currency} />
            </CardContent>
          </Card>
        ) : null}

        {account && account.employer_cost_by_entity.length > 0 ? (
          <Card aria-label="Employer cost by entity">
            <CardContent className="pt-6">
              <BarChart
                bars={account.employer_cost_by_entity}
                currency={data.currency}
              />
            </CardContent>
          </Card>
        ) : null}

        {account && account.pending_entity_names.length > 0 ? (
          <Card aria-label="Pending entities">
            <CardHeader>
              <CardTitle>Pending conversion</CardTitle>
              <CardDescription>
                Entities not yet included in account totals.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-inside list-disc space-y-1 text-sm">
                {account.pending_entity_names.map((name) => (
                  <li key={name}>{name}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ) : null}

        {ruleTotals.length > 0 ? (
          <Card aria-label="Rule totals">
            <CardHeader>
              <CardTitle>Rule totals (latest month)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {(["employee_deduction", "employer_contribution"] as const).map(
                (side) => {
                  const rows = ruleTotals.filter((row) => row.side === side);
                  if (rows.length === 0) {
                    return null;
                  }
                  return (
                    <div key={side}>
                      <h3 className="mb-2 text-sm font-medium">
                        {ruleSideLabel(side)}
                      </h3>
                      <ul className="space-y-1 text-sm">
                        {rows.map((row) => (
                          <li
                            key={`${row.side}-${row.name}`}
                            className="flex justify-between gap-4 border-b border-border py-2 last:border-0"
                          >
                            <span>{row.name}</span>
                            <span className="tabular-nums text-muted-foreground">
                              {formatMinor(row.amount_minor, data.currency)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                },
              )}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </>
  );
}
