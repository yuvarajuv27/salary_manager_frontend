import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { PageHeader } from "@/components/layout/PageHeader";
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
import { Skeleton } from "@/components/ui/skeleton";
import { nativeSelectClassName } from "@/lib/nativeSelectClassName";
import { PAY_FREQUENCIES, WEEKDAYS } from "../lib/paySchedule";
import { apiRequest } from "../lib/api";
import { PRIMARY_CURRENCIES } from "../lib/currencies";
import { apply422Errors } from "../lib/rhfErrors";
import { toastError, toastSuccess } from "../lib/toast";
import type { Company, PayFrequency } from "../types/api";
import { isApiError422 } from "../types/api";

type CompanyForm = {
  legal_name: string;
  primary_currency: string;
  pay_frequency: PayFrequency;
  payroll_day: string;
  pay_weekday: string;
  biweekly_anchor_on: string;
};

function schedulePayload(values: CompanyForm) {
  const body: Record<string, string | number> = {
    legal_name: values.legal_name,
    primary_currency: values.primary_currency,
    pay_frequency: values.pay_frequency,
  };
  if (values.pay_frequency === "monthly") {
    body.payroll_day = Number(values.payroll_day);
  } else {
    body.pay_weekday = Number(values.pay_weekday);
    if (values.pay_frequency === "biweekly") {
      body.biweekly_anchor_on = values.biweekly_anchor_on;
    }
  }
  return body;
}

export default function CompanyPage() {
  const queryClient = useQueryClient();
  const { data: company, isLoading } = useQuery({
    queryKey: ["company"],
    queryFn: () => apiRequest("/company") as Promise<Company>,
  });

  const form = useForm<CompanyForm>({
    defaultValues: {
      legal_name: "",
      primary_currency: "USD",
      pay_frequency: "monthly",
      payroll_day: "31",
      pay_weekday: "5",
      biweekly_anchor_on: "",
    },
  });

  const payFrequency = useWatch({ control: form.control, name: "pay_frequency" });

  useEffect(() => {
    if (!company) {
      return;
    }
    form.reset({
      legal_name: company.legal_name,
      primary_currency: company.primary_currency,
      pay_frequency: company.pay_frequency ?? "monthly",
      payroll_day: String(company.payroll_day ?? 31),
      pay_weekday: String(company.pay_weekday ?? 5),
      biweekly_anchor_on: company.biweekly_anchor_on ?? "",
    });
  }, [company, form]);

  const saveCompany = useMutation({
    mutationFn: (values: CompanyForm) =>
      apiRequest("/company", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(schedulePayload(values)),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["company"] });
      toastSuccess("Company saved");
    },
    onError: (error) => {
      if (isApiError422(error)) {
        apply422Errors(form.setError, error.errors);
        return;
      }
      toastError("Could not save company");
    },
  });

  if (isLoading || !company) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-56 w-full max-w-md" />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Company"
        description="Legal name, currency, and payroll schedule."
        actions={
          <Button
            type="submit"
            form="company-form"
            disabled={!form.formState.isDirty || saveCompany.isPending}
          >
            Save
          </Button>
        }
      />
      <div className="space-y-6 p-6">
        <Card>
          <CardHeader>
            <CardTitle>Company settings</CardTitle>
            <CardDescription>
              Next payroll on: {company.next_payroll_on}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              id="company-form"
              onSubmit={form.handleSubmit((values) => saveCompany.mutate(values))}
              className="flex max-w-md flex-col gap-4"
            >
              <div className="flex flex-col gap-2">
                <Label htmlFor="legal_name">Legal name</Label>
                <Input
                  id="legal_name"
                  {...form.register("legal_name", { required: true })}
                />
                {form.formState.errors.legal_name?.message ? (
                  <p role="alert" className="text-sm text-destructive">
                    {form.formState.errors.legal_name.message}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="primary_currency">Primary currency</Label>
                <select
                  id="primary_currency"
                  className={nativeSelectClassName}
                  {...form.register("primary_currency")}
                >
                  {PRIMARY_CURRENCIES.map((code) => (
                    <option key={code} value={code}>
                      {code}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="pay_frequency">Pay frequency</Label>
                <select
                  id="pay_frequency"
                  className={nativeSelectClassName}
                  {...form.register("pay_frequency")}
                >
                  {PAY_FREQUENCIES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              {payFrequency === "monthly" ? (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="payroll_day">Payroll day</Label>
                  <Input
                    id="payroll_day"
                    type="number"
                    min={1}
                    max={31}
                    {...form.register("payroll_day", { required: true })}
                  />
                </div>
              ) : null}
              {payFrequency === "weekly" || payFrequency === "biweekly" ? (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="pay_weekday">Payday weekday</Label>
                  <select
                    id="pay_weekday"
                    className={nativeSelectClassName}
                    {...form.register("pay_weekday", { required: true })}
                  >
                    {WEEKDAYS.map((day) => (
                      <option key={day.value} value={day.value}>
                        {day.label}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
              {payFrequency === "biweekly" ? (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="biweekly_anchor_on">Biweekly anchor date</Label>
                  <Input
                    id="biweekly_anchor_on"
                    type="date"
                    {...form.register("biweekly_anchor_on", { required: true })}
                  />
                </div>
              ) : null}
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
