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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiRequest } from "../lib/api";
import type { Entity, PayrollRunSummary } from "../types/api";

export default function PayrollPeriodsPage() {
  const { id } = useParams<{ id: string }>();

  const { data: entity, isLoading: entityLoading } = useQuery({
    queryKey: ["entities", id],
    queryFn: () => apiRequest(`/entities/${id}`) as Promise<Entity>,
    enabled: Boolean(id),
  });

  const { data: runs = [], isLoading: runsLoading } = useQuery({
    queryKey: ["payroll-runs", id],
    queryFn: () =>
      apiRequest(`/entities/${id}/payroll_runs`) as Promise<PayrollRunSummary[]>,
    enabled: Boolean(id),
  });

  if (entityLoading || runsLoading || !entity) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const sorted = [...runs].sort((a, b) => b.month_on.localeCompare(a.month_on));

  return (
    <>
      <PageHeader
        title="Payslips"
        description={`Credited payroll periods for ${entity.name}.`}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link to={`/entities/${id}`}>{entity.name}</Link>
          </Button>
        }
      />
      <div className="space-y-6 p-6">
        <Card>
          <CardHeader>
            <CardTitle>Payroll periods</CardTitle>
            <CardDescription>
              {sorted.length === 0
                ? "No credited periods yet."
                : `${sorted.length} period${sorted.length === 1 ? "" : "s"}.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Payroll on</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((run) => (
                  <TableRow key={run.month_on}>
                    <TableCell className="font-medium">
                      <Link
                        to={`/entities/${id}/payroll/${run.month_on}`}
                        className="text-primary underline-offset-4 hover:underline"
                      >
                        {run.month_on}
                      </Link>
                    </TableCell>
                    <TableCell>{run.payroll_on}</TableCell>
                    <TableCell>{run.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
