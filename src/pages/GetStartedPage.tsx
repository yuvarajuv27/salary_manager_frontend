import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { AuthCardLayout } from "@/components/layout/AuthCardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { sessionQueryKey } from "../hooks/useSession";
import { apiRequest } from "../lib/api";
import { PRIMARY_CURRENCIES } from "../lib/currencies";
import { PAY_FREQUENCIES, WEEKDAYS, type PayFrequencyValue } from "../lib/paySchedule";
import { isApiError422 } from "../types/api";

const selectClassName = cn(
  "h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-2.5 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30",
);

type SignUpBody = {
  legal_name: string;
  primary_currency: string;
  pay_frequency: PayFrequencyValue;
  payroll_day?: number;
  pay_weekday?: number;
  biweekly_anchor_on?: string;
  name: string;
  email: string;
  password: string;
};

function fieldErrors(errors: unknown, field: string): string[] {
  if (
    typeof errors === "object" &&
    errors !== null &&
    field in errors &&
    Array.isArray((errors as Record<string, unknown>)[field])
  ) {
    return (errors as Record<string, string[]>)[field];
  }
  return [];
}

export default function GetStartedPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [legalName, setLegalName] = useState("");
  const [primaryCurrency, setPrimaryCurrency] = useState<string>("USD");
  const [payFrequency, setPayFrequency] = useState<PayFrequencyValue>("monthly");
  const [payrollDay, setPayrollDay] = useState("31");
  const [payWeekday, setPayWeekday] = useState("5");
  const [biweeklyAnchorOn, setBiweeklyAnchorOn] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});

  const signUp = useMutation({
    mutationFn: (body: SignUpBody) =>
      apiRequest("/sign_up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: sessionQueryKey });
      navigate("/onboarding");
    },
    onError: (error) => {
      if (isApiError422(error)) {
        const errors = error.errors;
        if (typeof errors === "object" && errors !== null && !Array.isArray(errors)) {
          setFormErrors(errors as Record<string, string[]>);
        }
      }
    },
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormErrors({});
    const body: SignUpBody = {
      legal_name: legalName,
      primary_currency: primaryCurrency,
      pay_frequency: payFrequency,
      name,
      email,
      password,
    };
    if (payFrequency === "monthly") {
      body.payroll_day = Number(payrollDay);
    } else {
      body.pay_weekday = Number(payWeekday);
      if (payFrequency === "biweekly") {
        body.biweekly_anchor_on = biweeklyAnchorOn;
      }
    }
    signUp.mutate(body);
  }

  return (
    <AuthCardLayout
      title="Get started"
      footer={
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            to="/sign-in"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="legal_name">Company legal name</Label>
          <Input
            id="legal_name"
            name="legal_name"
            value={legalName}
            onChange={(e) => setLegalName(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="primary_currency">Primary currency</Label>
          <select
            id="primary_currency"
            name="primary_currency"
            className={selectClassName}
            value={primaryCurrency}
            onChange={(e) => setPrimaryCurrency(e.target.value)}
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
            name="pay_frequency"
            className={selectClassName}
            value={payFrequency}
            onChange={(e) => setPayFrequency(e.target.value as PayFrequencyValue)}
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
              name="payroll_day"
              type="number"
              min={1}
              max={31}
              value={payrollDay}
              onChange={(e) => setPayrollDay(e.target.value)}
              required
            />
          </div>
        ) : null}
        {payFrequency === "weekly" || payFrequency === "biweekly" ? (
          <div className="flex flex-col gap-2">
            <Label htmlFor="pay_weekday">Payday weekday</Label>
            <select
              id="pay_weekday"
              name="pay_weekday"
              className={selectClassName}
              value={payWeekday}
              onChange={(e) => setPayWeekday(e.target.value)}
              required
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
              name="biweekly_anchor_on"
              type="date"
              value={biweeklyAnchorOn}
              onChange={(e) => setBiweeklyAnchorOn(e.target.value)}
              required
            />
          </div>
        ) : null}
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Your name</Label>
          <Input
            id="name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            aria-invalid={fieldErrors(formErrors, "email").length > 0}
          />
          {fieldErrors(formErrors, "email").map((message) => (
            <p key={message} role="alert" className="text-sm text-destructive">
              {message}
            </p>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <Button type="submit" disabled={signUp.isPending} className="w-full">
          Get started
        </Button>
      </form>
    </AuthCardLayout>
  );
}
