export type ApiError401 = { status: 401 };

export type ApiError422 = {
  status: 422;
  errors: Record<string, string[]> | unknown;
};

export type ApiError = ApiError401 | ApiError422;

export type SessionUser = {
  id: number;
  name: string;
  email: string;
  access_role: "admin" | "hr";
  entity_id: number | null;
};

export type SessionCompany = {
  id: number;
  has_entity: boolean;
};

export type SessionResponse = {
  user: SessionUser;
  company: SessionCompany;
};

export type PayFrequency = "monthly" | "weekly" | "biweekly";

export type Company = {
  id: number;
  legal_name: string;
  primary_currency: string;
  pay_frequency: PayFrequency;
  payroll_day: number;
  pay_weekday: number | null;
  biweekly_anchor_on: string | null;
  next_payroll_on: string;
};

export type Entity = {
  id: number;
  name: string;
  country: string;
  currency: string;
};

export type UserRecord = {
  id: number;
  name: string;
  email: string;
  access_role: "admin" | "hr";
  entity_id: number | null;
};

export type PayRule = {
  id: number;
  entity_id: number;
  name: string;
  position: number;
  side: "earning" | "employee_deduction" | "employer_contribution";
  kind: "percent" | "fixed";
  percent: string | null;
  amount_minor: number | null;
  ceiling_minor: number | null;
};

export type PayRuleInput = {
  name: string;
  position: number;
  side: PayRule["side"];
  kind: PayRule["kind"];
  percent?: string | null;
  amount_minor?: number | null;
  ceiling_minor?: number | null;
};

export type PayPreviewLine = {
  position: number;
  name: string;
  side: PayRule["side"];
  kind: PayRule["kind"];
  percent: string | null;
  amount_minor: number | null;
  ceiling_minor: number | null;
  computed_minor: number;
};

export type PayPreviewResponse = {
  earnings: PayPreviewLine[];
  deductions: PayPreviewLine[];
  employer_contributions: PayPreviewLine[];
  net_minor: number;
  employer_cost_minor: number;
};

export type EmployeeBankDetails =
  | Record<string, string>
  | { readable: false };

export type Employee = {
  id: number;
  entity_id: number;
  name: string;
  job_role: string;
  department: string;
  start_on: string;
  end_on: string | null;
  bank_details: EmployeeBankDetails;
};

export type EmployeesIndexResponse = {
  employees: Employee[];
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
};

export type PayrollRunSummary = {
  month_on: string;
  payroll_on: string;
  status: string;
};

export type PayrollMonthPayslipEntry = {
  type: "payslip";
  payslip_id: number;
  employee_id: number;
  employee_name: string;
  gross_minor: number;
  net_minor: number;
  employer_cost_minor: number;
};

export type PayrollMonthSkipEntry = {
  type: "skip";
  employee_id: number;
  employee_name: string;
  reason: string;
};

export type PayrollMonthEntry =
  | PayrollMonthPayslipEntry
  | PayrollMonthSkipEntry;

export type PayrollMonthResponse = PayrollRunSummary & {
  entries: PayrollMonthEntry[];
};

export type PayslipLine = PayPreviewLine;

export type PayslipDetail = {
  id: number;
  employee_id: number;
  employee_name: string;
  job_role: string;
  department: string;
  month_on: string;
  payroll_on: string;
  currency: string;
  payable_days: number;
  leave_days_count: number;
  outside_days: number;
  salary_minor: number;
  gross_minor: number;
  net_minor: number;
  employer_cost_minor: number;
  lines: PayslipLine[];
};

export type AnalyticsMonthSnapshot = {
  month_on: string;
  headcount: number;
  gross_minor: number;
  net_minor: number;
  employer_cost_minor: number;
};

export type AnalyticsSeriesRow = {
  month_on: string;
  gross_minor: number;
  net_minor: number;
  employer_cost_minor: number;
};

export type AnalyticsRuleTotal = {
  name: string;
  side: "employee_deduction" | "employer_contribution";
  amount_minor: number;
};

export type EntityAnalyticsResponse = {
  currency: string;
  latest: AnalyticsMonthSnapshot | null;
  series: AnalyticsSeriesRow[];
  rule_totals: AnalyticsRuleTotal[];
  empty: boolean;
};

export type EmployerCostByEntity = {
  entity_id: number;
  name: string;
  employer_cost_minor: number;
};

export type AccountAnalyticsResponse = EntityAnalyticsResponse & {
  employer_cost_by_entity: EmployerCostByEntity[];
  pending_entity_names: string[];
};

export function isApiError422(error: unknown): error is ApiError422 {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    (error as ApiError422).status === 422
  );
}
