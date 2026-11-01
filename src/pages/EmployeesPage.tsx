import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useParams } from "react-router";
import BankFieldsForm from "../components/bank/BankFieldsForm";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { emptyBankDraft } from "../lib/bankFields";
import { apply422Errors } from "../lib/rhfErrors";
import { toastError, toastSuccess } from "../lib/toast";
import type { EmployeesIndexResponse, Entity } from "../types/api";
import { isApiError422 } from "../types/api";

type CreateEmployeeForm = {
  name: string;
  job_role: string;
  department: string;
  start_on: string;
  bank_details: Record<string, string>;
};

const PER_PAGE = 50;

export default function EmployeesPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: entity, isLoading: entityLoading } = useQuery({
    queryKey: ["entities", id],
    queryFn: () => apiRequest(`/entities/${id}`) as Promise<Entity>,
    enabled: Boolean(id),
  });

  const { data, isLoading: employeesLoading, isFetching } = useQuery({
    queryKey: ["employees", id, page, q],
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(page),
        per_page: String(PER_PAGE),
      });
      if (q.trim()) {
        params.set("q", q.trim());
      }
      return apiRequest(
        `/entities/${id}/employees?${params}`,
      ) as Promise<EmployeesIndexResponse>;
    },
    enabled: Boolean(id),
  });

  const form = useForm<CreateEmployeeForm>({
    defaultValues: {
      name: "",
      job_role: "",
      department: "",
      start_on: "",
      bank_details: {},
    },
  });

  useEffect(() => {
    if (entity?.country) {
      form.reset({
        name: "",
        job_role: "",
        department: "",
        start_on: "",
        bank_details: emptyBankDraft(entity.country),
      });
    }
  }, [entity?.country, form, dialogOpen]);

  const createEmployee = useMutation({
    mutationFn: (body: CreateEmployeeForm) =>
      apiRequest(`/entities/${id}/employees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["employees", id] });
      toastSuccess("Employee created");
      setDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      if (isApiError422(error)) {
        apply422Errors(form.setError, error.errors);
        return;
      }
      toastError("Could not create employee");
    },
  });

  const employees = data?.employees ?? [];
  const totalPages = data?.total_pages ?? 1;
  const total = data?.total ?? 0;

  if (entityLoading || (employeesLoading && !data) || !entity) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Employees"
        description={`Workforce for ${entity.name}.`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to={`/entities/${id}`}>{entity.name}</Link>
            </Button>
            <Button type="button" size="sm" onClick={() => setDialogOpen(true)}>
              Add employee
            </Button>
          </div>
        }
      />
      <div className="space-y-6 p-6">
        <Card>
          <CardHeader className="gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <CardTitle>All employees</CardTitle>
              <CardDescription>
                {total === 0
                  ? "No employees yet."
                  : `${total} employee${total === 1 ? "" : "s"}.`}
                {isFetching ? " Updating…" : null}
              </CardDescription>
            </div>
            <form
              className="flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                setPage(1);
                setQ(search);
              }}
            >
              <Input
                aria-label="Search employees"
                placeholder="Search by name"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-56"
              />
              <Button type="submit" variant="outline">
                Search
              </Button>
            </form>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Job role</TableHead>
                  <TableHead>Department</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">
                      <Link
                        to={`/entities/${id}/employees/${employee.id}`}
                        className="text-primary underline-offset-4 hover:underline"
                      >
                        {employee.name}
                      </Link>
                    </TableCell>
                    <TableCell>{employee.job_role}</TableCell>
                    <TableCell>{employee.department}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-4 flex items-center justify-between gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Previous
              </Button>
              <p className="text-sm text-muted-foreground">
                Page {page} of {Math.max(totalPages, 1)}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add employee</DialogTitle>
            <DialogDescription>
              Bank details must be complete before creating an employee.
            </DialogDescription>
          </DialogHeader>
          <form
            className="flex flex-col gap-4"
            onSubmit={form.handleSubmit((values) => createEmployee.mutate(values))}
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="employee_name">Name</Label>
              <Input id="employee_name" {...form.register("name", { required: true })} />
              {form.formState.errors.name?.message ? (
                <p role="alert" className="text-sm text-destructive">
                  {form.formState.errors.name.message}
                </p>
              ) : null}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="employee_job_role">Job role</Label>
              <Input
                id="employee_job_role"
                {...form.register("job_role", { required: true })}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="employee_department">Department</Label>
              <Input
                id="employee_department"
                {...form.register("department", { required: true })}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="employee_start_on">Start date</Label>
              <Input
                id="employee_start_on"
                type="date"
                {...form.register("start_on", { required: true })}
              />
            </div>
            <BankFieldsForm
              country={entity.country}
              values={form.watch("bank_details")}
              onChange={(values) =>
                form.setValue("bank_details", values, { shouldDirty: true })
              }
              idPrefix="new_employee_bank"
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!form.formState.isDirty || createEmployee.isPending}
              >
                Create employee
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
