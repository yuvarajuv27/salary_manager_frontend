import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router";
import BankFieldsForm from "../components/bank/BankFieldsForm";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "../lib/api";
import {
  bankDraftIsComplete,
  emptyBankDraft,
} from "../lib/bankFields";
import { fieldErrors } from "../lib/formErrors";
import { toastError, toastSuccess } from "../lib/toast";
import type { Employee, Entity } from "../types/api";
import { isApiError422 } from "../types/api";
import { Skeleton } from "@/components/ui/skeleton";

export default function EmployeeDetailPage() {
  const { id, employeeId } = useParams<{ id: string; employeeId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: entity, isLoading: entityLoading } = useQuery({
    queryKey: ["entities", id],
    queryFn: () => apiRequest(`/entities/${id}`) as Promise<Entity>,
    enabled: Boolean(id),
  });

  const { data: employee, isLoading: employeeLoading } = useQuery({
    queryKey: ["employees", id, employeeId],
    queryFn: () =>
      apiRequest(
        `/entities/${id}/employees/${employeeId}`,
      ) as Promise<Employee>,
    enabled: Boolean(id && employeeId),
  });

  const [name, setName] = useState("");
  const [jobRole, setJobRole] = useState("");
  const [department, setDepartment] = useState("");
  const [startOn, setStartOn] = useState("");
  const [endOn, setEndOn] = useState("");
  const [bankDraft, setBankDraft] = useState<Record<string, string>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (employee) {
      setName(employee.name);
      setJobRole(employee.job_role);
      setDepartment(employee.department);
      setStartOn(employee.start_on);
      setEndOn(employee.end_on ?? "");
    }
  }, [employee]);

  useEffect(() => {
    if (entity?.country) {
      setBankDraft(emptyBankDraft(entity.country));
    }
  }, [entity?.country]);

  const saveEmployee = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiRequest(`/entities/${id}/employees/${employeeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["employees", id] });
      await queryClient.invalidateQueries({
        queryKey: ["employees", id, employeeId],
      });
      if (entity?.country) {
        setBankDraft(emptyBankDraft(entity.country));
      }
      setFormErrors({});
      toastSuccess("Employee saved");
    },
    onError: (error) => {
      if (isApiError422(error)) {
        const errors = error.errors;
        if (typeof errors === "object" && errors !== null && !Array.isArray(errors)) {
          setFormErrors(errors as Record<string, string[]>);
        }
        return;
      }
      toastError("Could not save employee");
    },
  });

  const deleteEmployee = useMutation({
    mutationFn: () =>
      apiRequest(`/entities/${id}/employees/${employeeId}`, {
        method: "DELETE",
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["employees", id] });
      toastSuccess("Employee deleted");
      navigate(`/entities/${id}/employees`);
    },
    onError: (error) => {
      if (isApiError422(error)) {
        const errors = error.errors;
        if (typeof errors === "object" && errors !== null && !Array.isArray(errors)) {
          setFormErrors(errors as Record<string, string[]>);
        }
        return;
      }
      toastError("Could not delete employee");
    },
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormErrors({});
    const body: Record<string, unknown> = {
      name,
      job_role: jobRole,
      department,
      start_on: startOn,
      end_on: endOn || null,
    };
    if (entity && bankDraftIsComplete(entity.country, bankDraft)) {
      body.bank_details = bankDraft;
    }
    saveEmployee.mutate(body);
  }

  if (entityLoading || employeeLoading || !entity || !employee) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const profileDirty =
    name !== employee.name ||
    jobRole !== employee.job_role ||
    department !== employee.department ||
    startOn !== employee.start_on ||
    endOn !== (employee.end_on ?? "") ||
    bankDraftIsComplete(entity.country, bankDraft);

  return (
    <>
      <PageHeader
        title={employee.name}
        description={`${employee.job_role} · ${employee.department}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to={`/entities/${id}/employees`}>Employees</Link>
            </Button>
            <Button
              type="submit"
              form="employee-detail-form"
              disabled={!profileDirty || saveEmployee.isPending}
            >
              Save
            </Button>
          </div>
        }
      />
      <div className="space-y-6 p-6">
        <Card>
          <CardHeader>
            <CardTitle>Employee details</CardTitle>
            <CardDescription>
              Update profile fields or replace bank details with a complete new set.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              id="employee-detail-form"
              onSubmit={handleSubmit}
              className="flex max-w-md flex-col gap-4"
            >
              <div className="flex flex-col gap-2">
                <Label htmlFor="employee_name">Name</Label>
                <Input
                  id="employee_name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                {fieldErrors(formErrors, "name").map((message) => (
                  <p key={message} role="alert" className="text-sm text-destructive">
                    {message}
                  </p>
                ))}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="employee_job_role">Job role</Label>
                <Input
                  id="employee_job_role"
                  value={jobRole}
                  onChange={(e) => setJobRole(e.target.value)}
                  required
                />
                {fieldErrors(formErrors, "job_role").map((message) => (
                  <p key={message} role="alert" className="text-sm text-destructive">
                    {message}
                  </p>
                ))}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="employee_department">Department</Label>
                <Input
                  id="employee_department"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  required
                />
                {fieldErrors(formErrors, "department").map((message) => (
                  <p key={message} role="alert" className="text-sm text-destructive">
                    {message}
                  </p>
                ))}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="employee_start_on">Start date</Label>
                <Input
                  id="employee_start_on"
                  type="date"
                  value={startOn}
                  onChange={(e) => setStartOn(e.target.value)}
                  required
                />
                {fieldErrors(formErrors, "start_on").map((message) => (
                  <p key={message} role="alert" className="text-sm text-destructive">
                    {message}
                  </p>
                ))}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="employee_end_on">End date</Label>
                <Input
                  id="employee_end_on"
                  type="date"
                  value={endOn}
                  onChange={(e) => setEndOn(e.target.value)}
                />
                {fieldErrors(formErrors, "end_on").map((message) => (
                  <p key={message} role="alert" className="text-sm text-destructive">
                    {message}
                  </p>
                ))}
              </div>
              <BankFieldsForm
                country={entity.country}
                displayed={employee.bank_details}
                values={bankDraft}
                onChange={setBankDraft}
                errors={formErrors}
                idPrefix="employee_bank"
              />
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      type="button"
                      variant="destructive"
                      disabled={deleteEmployee.isPending}
                    >
                      Delete employee
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete employee?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This permanently removes {employee.name} and cannot be
                        undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        variant="destructive"
                        onClick={() => deleteEmployee.mutate()}
                      >
                        Delete employee
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
              {fieldErrors(formErrors, "base").map((message) => (
                <p key={message} role="alert" className="text-sm text-destructive">
                  {message}
                </p>
              ))}
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
