import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "../lib/api";
import { formatMinor } from "../lib/money";
import type { PayslipDetail, PayslipLine } from "../types/api";

function PayslipLineCard({
  title,
  lines,
  currency,
}: {
  title: string;
  lines: PayslipLine[];
  currency: string;
}) {
  if (lines.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-1 text-sm text-muted-foreground">
          {lines.map((line) => (
            <li key={`${line.position}-${line.name}-${line.side}`}>
              {line.name}: {formatMinor(line.computed_minor, currency)}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function linesForSide(lines: PayslipLine[], side: PayslipLine["side"]) {
  return lines
    .filter((line) => line.side === side)
    .sort((a, b) => a.position - b.position);
}

export default function PayslipDetailPage() {
  const { id, month, payslipId } = useParams<{
    id: string;
    month: string;
    payslipId: string;
  }>();

  const { data: payslip, isLoading } = useQuery({
    queryKey: ["payslips", id, payslipId],
    queryFn: () =>
      apiRequest(`/entities/${id}/payslips/${payslipId}`) as Promise<PayslipDetail>,
    enabled: Boolean(id && payslipId),
  });

  if (isLoading || !payslip || !id || !month) {
    return <p className="p-6 text-sm text-muted-foreground">Loading…</p>;
  }

  const earnings = linesForSide(payslip.lines, "earning");
  const deductions = linesForSide(payslip.lines, "employee_deduction");
  const employerContributions = linesForSide(
    payslip.lines,
    "employer_contribution",
  );
  const currency = payslip.currency;

  return (
    <>
      <PageHeader
        title={payslip.employee_name}
        description={`${payslip.job_role}, ${payslip.department}`}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link to={`/entities/${id}/payroll/${month}`}>
              Payroll {month}
            </Link>
          </Button>
        }
      />
      <div className="space-y-6 p-6">
        <Card>
          <CardHeader>
            <CardTitle>Pay period</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-muted-foreground">
            <p>Month: {payslip.month_on}</p>
            <p>Payroll on: {payslip.payroll_on}</p>
            <p>Payable days: {payslip.payable_days}</p>
            <p>Leave days: {payslip.leave_days_count}</p>
            <p>Days outside employment: {payslip.outside_days}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="text-muted-foreground">
              Monthly salary: {formatMinor(payslip.salary_minor, currency)}
            </p>
            <p className="font-medium">
              Gross: {formatMinor(payslip.gross_minor, currency)}
            </p>
            <Separator className="my-3" />
            <p className="font-medium">
              Net: {formatMinor(payslip.net_minor, currency)}
            </p>
            <p className="text-muted-foreground">
              Employer cost:{" "}
              {formatMinor(payslip.employer_cost_minor, currency)}
            </p>
          </CardContent>
        </Card>

        {earnings.length > 0 ? (
          <PayslipLineCard
            title="Earnings"
            lines={earnings}
            currency={currency}
          />
        ) : null}
        <PayslipLineCard
          title="Employee deductions"
          lines={deductions}
          currency={currency}
        />
        <PayslipLineCard
          title="Employer contributions"
          lines={employerContributions}
          currency={currency}
        />
      </div>
    </>
  );
}
