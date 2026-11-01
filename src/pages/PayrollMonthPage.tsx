import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiRequest } from "../lib/api";
import { formatMinor } from "../lib/money";
import type {
  Entity,
  PayrollMonthEntry,
  PayrollMonthResponse,
} from "../types/api";

function MonthEntryRow({
  entityId,
  month,
  entry,
  currency,
}: {
  entityId: string;
  month: string;
  entry: PayrollMonthEntry;
  currency: string;
}) {
  if (entry.type === "skip") {
    return (
      <TableRow>
        <TableCell colSpan={3} className="text-muted-foreground">
          {entry.employee_name} — skipped ({entry.reason})
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow>
      <TableCell className="font-medium">
        <Link
          to={`/entities/${entityId}/payroll/${month}/${entry.payslip_id}`}
          className="text-primary underline-offset-4 hover:underline"
        >
          {entry.employee_name}
        </Link>
      </TableCell>
      <TableCell>{formatMinor(entry.gross_minor, currency)}</TableCell>
      <TableCell>{formatMinor(entry.net_minor, currency)}</TableCell>
    </TableRow>
  );
}

export default function PayrollMonthPage() {
  const { id, month } = useParams<{ id: string; month: string }>();

  const { data: entity, isLoading: entityLoading } = useQuery({
    queryKey: ["entities", id],
    queryFn: () => apiRequest(`/entities/${id}`) as Promise<Entity>,
    enabled: Boolean(id),
  });

  const { data: payrollMonth, isLoading: monthLoading } = useQuery({
    queryKey: ["payroll-runs", id, month],
    queryFn: () =>
      apiRequest(
        `/entities/${id}/payroll_runs/${month}`,
      ) as Promise<PayrollMonthResponse>,
    enabled: Boolean(id && month),
  });

  if (entityLoading || monthLoading || !entity || !payrollMonth || !id || !month) {
    return <p className="p-6 text-sm text-muted-foreground">Loading…</p>;
  }

  return (
    <>
      <PageHeader
        title={`Payroll ${payrollMonth.month_on}`}
        description={`Credited on ${payrollMonth.payroll_on}`}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link to={`/entities/${id}`}>{entity.name}</Link>
          </Button>
        }
      />
      <div className="space-y-6 p-6">
        <Card>
          <CardHeader>
            <CardTitle>Payslips</CardTitle>
            <CardDescription>
              {payrollMonth.entries.length === 0
                ? "No entries for this month."
                : `${payrollMonth.entries.length} entr${payrollMonth.entries.length === 1 ? "y" : "ies"}.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Gross</TableHead>
                  <TableHead>Net</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payrollMonth.entries.map((entry) => (
                  <MonthEntryRow
                    key={`${entry.type}-${entry.employee_id}`}
                    entityId={id}
                    month={month}
                    entry={entry}
                    currency={entity.currency}
                  />
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
