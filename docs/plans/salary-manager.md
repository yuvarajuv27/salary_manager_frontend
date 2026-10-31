# Salary Manager Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Git (project override):** Do **not** `git commit`, `git push`, or open PRs unless the user explicitly asks in that conversation. End each task with tests green and an uncommitted worktree (or leave files as-is). Skip every “Commit” step below unless the user asks to commit.

**Goal:** Ship the Salary Manager release: multi-company Admin/HR payroll for nine countries, with session cookie auth, rule preview, scheduled payslip credit, Frankfurter conversion, and entity/account analytics — matching `docs/requirements/project.md` and both architecture docs.

**Architecture:** Rails API owns records, money math, authorization, and the Solid Queue payroll clock. React (TypeScript, declarative React Router v7, TanStack Query) owns screens and form state; it never calculates pay and never authorizes beyond hiding links. Amounts on the wire are integer minor units plus currency code. Session is an HttpOnly `SameSite=Lax` cookie with `credentials: "include"`.

**Tech Stack:** Rails `~> 8.1.4`, PostgreSQL, Solid Queue, bcrypt, Active Record Encryption, HTTParty (Frankfurter), RSpec. Vite + React 19, TypeScript, `react-router` 7 (declarative), `@tanstack/react-query`, Vitest + Testing Library. No Axios, RHF, chart libs, component libs, or CSS frameworks.

**Specs (read before coding):**

| Doc | Path |
|---|---|
| Requirements | `salary_manager_frontend/docs/requirements/project.md` |
| FE architecture | `salary_manager_frontend/docs/architecture/salary-manager.md` |
| BE architecture | `salary_manager_backend/docs/architecture/salary-manager.md` |
| BE plan companion | `salary_manager_backend/docs/plans/salary-manager.md` |

## Global Constraints

- Countries: India, United States, United Kingdom, Canada, Japan, Australia, Singapore, Portugal, France — with payout currencies from FR-5.
- Primary currencies: INR, USD, GBP, CAD, JPY, AUD, SGD, EUR.
- Money: `bigint` minor units; JPY exponent 0; others exponent 2. Percents: `numeric(7,4)`, `(0, 100]`, up to four decimal places.
- Rounding: half away from zero, once, to the currency’s minor unit.
- Clock: UTC only. Payroll fires at `00:00 UTC` as the payroll day begins. No company timezone.
- Auth: HttpOnly session cookie, `SameSite=Lax`, not `SameSite=None`. API forgery protection stays off. Deployed FE+API must be same-site.
- Authorization: session `company_id` scopes every query. Admin = whole company. HR = one `entity_id`. Cross-tenant / wrong-entity = **404**. No session = **401**. Validation = **422** with field errors.
- FE must not derive net, gross, or employer cost; preview/payslip responses are the only source.
- Out of scope: payouts, employee login, user edit/delete, country packs, bracket rules, paid leave, holidays, filings (see requirements “Outside this release”).
- TDD: RED → GREEN → REFACTOR for every behavior change. BE: RSpec. FE: Vitest + Testing Library (request shape + render; no money math in FE tests).

---

## Milestones (demo gates)

Each milestone ends with **working, testable software**. Do not start the next milestone until the previous gate passes.

| Milestone | Name | Demo gate |
|---|---|---|
| **M0** | Foundations | BE boots with RSpec + session middleware + CORS credentials; FE boots with TS + Router + Query + Vitest |
| **M1** | Identity | Get started creates company + Admin and sets cookie; Sign in / Sign out / `GET /session` work; taken email is 422 |
| **M2** | Organization & access | Onboarding creates first entity; Admin manages company/users/entities; HR sees only their entity (404 otherwise) |
| **M3** | Rules & calculator | Rule CRUD + reorder; preview returns FR-19 worked example; FE Rules screen posts unsaved rules + typed gross |
| **M4** | Workforce | Employees with encrypted/masked bank details; salary correction/revision; leave; country change with bank replace |
| **M5** | Payroll credit | Hourly wake credits due companies; payslips + skips; closed month immutable; payslip list/detail screens |
| **M6** | Currency & analytics | Frankfurter store/pending/backfill; entity + account analytics; empty state; SVG charts |

**Suggested execution order inside a milestone:** BE domain + API first (tests green), then FE screens that call those endpoints, then the milestone gate checklist.

---

## File map (create unless noted)

### Backend (`salary_manager_backend/`)

| Path | Responsibility |
|---|---|
| `Gemfile` | Uncomment `bcrypt`; add `httparty`, `rspec-rails` (dev/test) |
| `config/application.rb` | Re-enable cookie/session middleware for API-only |
| `config/initializers/cors.rb` | `credentials: true`; Vite origins |
| `config/initializers/session_store.rb` | Cookie session store |
| `config/initializers/active_record_encryption.rb` | Encryption keys from env |
| `config/recurring.yml` | Hourly payroll scheduler task |
| `config/routes.rb` | All API routes from BE architecture |
| `db/migrate/*` | Tables from BE architecture Database section |
| `app/models/company.rb` | Tenant; `payroll_day`, `next_payroll_on`, primary currency |
| `app/models/user.rb` | `has_secure_password`; admin/hr checks |
| `app/models/entity.rb` | Country → currency; country lock |
| `app/models/employee.rb` | Employment dates; encrypted `bank_payload` |
| `app/models/salary_assignment.rb` | `effective_on` + `amount_minor` |
| `app/models/leave_day.rb` | Unique employee+date |
| `app/models/pay_rule.rb` | Side/kind/percent/amount/ceiling/position |
| `app/models/payroll_run.rb` | Company month run |
| `app/models/entity_credit.rb` | Per-entity credit status |
| `app/models/payslip.rb` | Insert-only credit result + `lines` jsonb |
| `app/models/payroll_skip.rb` | Unset-salary skip |
| `app/models/currency_conversion.rb` | Stored/pending conversion |
| `app/models/concerns/company_scoped.rb` | Default scope / association helpers if needed |
| `app/services/countries.rb` | Country → currency + bank field keys |
| `app/services/money_rounding.rb` | Half-away-from-zero to minor units |
| `app/services/payroll_calendar.rb` | Payroll date for month; next future date; short months |
| `app/services/bank_details.rb` | Validate complete set; mask; encrypt document shape |
| `app/services/salary_writer.rb` | Correction vs revision writes |
| `app/services/pay_calculator.rb` | Preview + run calculator (single object) |
| `app/services/frankfurter_client.rb` | Injectable HTTParty client |
| `app/services/analytics/entity_analytics.rb` | Entity aggregates |
| `app/services/analytics/account_analytics.rb` | Primary-currency aggregates |
| `app/jobs/payroll_scheduler_job.rb` | Hourly wake; open runs; enqueue batches |
| `app/jobs/entity_credit_job.rb` | Payslips + skips; enqueue conversion |
| `app/jobs/currency_conversion_job.rb` | Frankfurter + pending fill |
| `app/controllers/application_controller.rb` | Current user, 401/404 helpers |
| `app/controllers/sign_ups_controller.rb` | `POST /sign_up` |
| `app/controllers/sessions_controller.rb` | Session CRUD |
| `app/controllers/companies_controller.rb` | `GET/PATCH /company` |
| `app/controllers/users_controller.rb` | `GET/POST /users` |
| `app/controllers/entities_controller.rb` | Entity CRUD + country change |
| `app/controllers/pay_rules_controller.rb` | Rules + order + preview |
| `app/controllers/employees_controller.rb` | Employees + bank |
| `app/controllers/salaries_controller.rb` | Correction / revision |
| `app/controllers/leave_days_controller.rb` | Leave add/remove |
| `app/controllers/payroll_runs_controller.rb` | Credited months + month list |
| `app/controllers/payslips_controller.rb` | Payslip detail |
| `app/controllers/analytics_controller.rb` | Entity + account analytics |
| `spec/rails_helper.rb`, `spec/spec_helper.rb` | RSpec setup |
| `spec/services/*_spec.rb` | Calculator, calendar, bank, frankfurter, analytics |
| `spec/requests/*_spec.rb` | HTTP contract + authz + payroll scenarios |
| `spec/jobs/*_spec.rb` | Scheduler, credit, conversion |
| `spec/support/auth_helpers.rb` | Sign-in helpers for request specs |

### Frontend (`salary_manager_frontend/`)

| Path | Responsibility |
|---|---|
| `package.json` | Add `react-router`, `@tanstack/react-query`, `typescript`, `typescript-eslint`, vitest + Testing Library + jsdom |
| `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json` | TS project |
| `vite.config.ts` | Vite + vitest config (replace `vite.config.js`) |
| `src/main.tsx` | `QueryClientProvider` + `BrowserRouter` + `App` |
| `src/App.tsx` | Route table |
| `src/index.css` | Plain CSS (extend Vite template) |
| `src/lib/api.ts` | `fetch` wrapper: `credentials: "include"`, JSON, 401 → sign-in redirect (except session/get-started) |
| `src/lib/money.ts` | Format minor units for display (JPY 0 dp; others 2) |
| `src/lib/countries.ts` | Country list + bank field labels for forms |
| `src/types/api.ts` | Shared response/request types |
| `src/hooks/useSession.ts` | `GET /session` query |
| `src/components/AppShell.tsx` | Nav by role; sign out |
| `src/components/MoneyText.tsx` | Display helper |
| `src/components/charts/LineChart.tsx` | SVG line ≤12 months |
| `src/components/charts/BarChart.tsx` | SVG bar by entity |
| `src/components/bank/BankFieldsForm.tsx` | Country-specific fields; mask display |
| `src/pages/GetStartedPage.tsx` | Always with Sign in while signed out |
| `src/pages/SignInPage.tsx` | Sign in |
| `src/pages/OnboardingPage.tsx` | First entity |
| `src/pages/AnalyticsPage.tsx` | Landing: account (Admin) or entity (HR) |
| `src/pages/CompanyPage.tsx` | Admin company settings |
| `src/pages/UsersPage.tsx` | Admin user list/create |
| `src/pages/EntitiesPage.tsx` | Entity list/create |
| `src/pages/EntityDetailPage.tsx` | Rename / country change / delete |
| `src/pages/RulesPage.tsx` | Editor + live preview query |
| `src/pages/EmployeesPage.tsx` | Employee list/create |
| `src/pages/EmployeeDetailPage.tsx` | Edit, salary, leave, bank replace, delete |
| `src/pages/PayrollMonthPage.tsx` | Payslips + skips; skip has no detail link |
| `src/pages/PayslipDetailPage.tsx` | Credited payslip detail |
| `src/pages/EntityAnalyticsPage.tsx` | Per-entity analytics (Admin may open any) |
| `src/**/*.test.tsx` | Screen tests listed in FE architecture Testing |

---

## Milestone 0 — Foundations

**Done when:** `bundle exec rspec` runs (empty or smoke); `npm test` runs; API accepts CORS credentialed requests from Vite; session middleware loads.

### Task M0.1: Backend test + gem baseline

**Files:**
- Modify: `salary_manager_backend/Gemfile`
- Create: `salary_manager_backend/spec/spec_helper.rb`, `salary_manager_backend/spec/rails_helper.rb`
- Modify: remove or ignore default `test/` Minitest path for new work (prefer RSpec only going forward)

**Interfaces:**
- Produces: RSpec runnable via `bundle exec rspec`

- [ ] **Step 1: Add gems**

In `Gemfile`: uncomment `gem "bcrypt", "~> 3.1.7"`. Add `gem "httparty"`. In `group :development, :test` add `gem "rspec-rails"`.

- [ ] **Step 2: Install and generate RSpec**

Run:
```bash
cd /Users/yuvaraj/Personal/salary_manager_backend && bundle install && bin/rails generate rspec:install
```
Expected: `spec/rails_helper.rb` and `spec/spec_helper.rb` exist.

- [ ] **Step 3: Smoke spec**

Create `spec/smoke_spec.rb`:
```ruby
RSpec.describe "smoke" do
  it "loads the Rails environment" do
    expect(Rails.application).to be_present
  end
end
```

Run: `bundle exec rspec spec/smoke_spec.rb`
Expected: PASS

---

### Task M0.2: Session middleware, CORS credentials, encryption config

**Files:**
- Modify: `config/application.rb`
- Modify: `config/initializers/cors.rb`
- Create: `config/initializers/session_store.rb`
- Create: `config/initializers/active_record_encryption.rb`
- Modify: `.env` / credentials docs as needed for local keys (do not commit secrets)

**Interfaces:**
- Produces: Cookie sessions available; CORS allows Vite with credentials; encryption keys load in test/dev

- [ ] **Step 1: Re-enable cookies/session in API-only app**

In `config/application.rb` inside the `Application` class:
```ruby
config.middleware.use ActionDispatch::Cookies
config.middleware.use ActionDispatch::Session::CookieStore,
  key: "_salary_manager_session",
  same_site: :lax,
  secure: Rails.env.production?
```

- [ ] **Step 2: CORS with credentials**

Replace allow block so credentials work (origins must not be `*`):
```ruby
Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins(*ENV.fetch("CORS_ORIGINS") { "http://localhost:5173,http://localhost:5174" }.split(","))
    resource "*",
      headers: :any,
      methods: %i[get post put patch delete options head],
      credentials: true
  end
end
```

- [ ] **Step 3: Active Record Encryption keys for test**

In `config/initializers/active_record_encryption.rb`, load primary/deterministic keys from ENV; in `config/environments/test.rb` set deterministic test keys so specs can encrypt bank payloads.

- [ ] **Step 4: Verify boot**

Run: `cd /Users/yuvaraj/Personal/salary_manager_backend && bin/rails runner 'puts :ok'`
Expected: prints `ok`

---

### Task M0.3: Frontend TypeScript + Router + Query + Vitest

**Files:**
- Modify: `package.json`
- Create: `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`
- Create: `vite.config.ts` (replace `vite.config.js`)
- Create: `src/main.tsx`, `src/App.tsx`
- Create: `src/test/setup.ts`
- Modify: remove or stop using `src/main.jsx` / `src/App.jsx` after cutover

**Interfaces:**
- Produces: `npm run test`, `npm run build` succeed; app mounts under Router + QueryClient

- [ ] **Step 1: Install packages**

```bash
cd /Users/yuvaraj/Personal/salary_manager_frontend && npm install react-router @tanstack/react-query && npm install -D typescript typescript-eslint vitest jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom @types/node
```

- [ ] **Step 2: Vitest config in `vite.config.ts`**

```ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: { host: "0.0.0.0", port: 5173 },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    globals: true,
  },
});
```

Add scripts: `"test": "vitest run"`, `"test:watch": "vitest"`.

- [ ] **Step 3: Smoke component test**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

function Hello() {
  return <h1>Salary Manager</h1>;
}

describe("smoke", () => {
  it("renders", () => {
    render(<Hello />);
    expect(screen.getByRole("heading", { name: "Salary Manager" })).toBeInTheDocument();
  });
});
```

Run: `npm test`
Expected: PASS

- [ ] **Step 4: Wire `main.tsx`**

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
```

---

### Task M0.4: Shared FE API client + money format

**Files:**
- Create: `src/lib/api.ts`, `src/lib/money.ts`, `src/lib/money.test.ts`, `src/types/api.ts`

**Interfaces:**
- Produces: `apiRequest(path, init)` → JSON; throws typed errors for 401/422
- Produces: `formatMinor(amountMinor: number, currency: string): string`

- [ ] **Step 1: Failing money test**

```ts
import { describe, it, expect } from "vitest";
import { formatMinor } from "./money";

describe("formatMinor", () => {
  it("formats JPY with no decimals", () => {
    expect(formatMinor(1234, "JPY")).toBe("1,234");
  });
  it("formats USD with two decimals", () => {
    expect(formatMinor(12345, "USD")).toBe("123.45");
  });
});
```

Run: `npm test -- src/lib/money.test.ts`
Expected: FAIL (module missing)

- [ ] **Step 2: Implement `formatMinor`**

Use `Intl.NumberFormat` with `currency` style; JPY uses major=minor (divide by 1); others divide by 100.

- [ ] **Step 3: Implement `apiRequest`**

Base URL from `import.meta.env.VITE_API_URL` defaulting to `http://localhost:3000`. Always `credentials: "include"`. Parse JSON. On 422 throw `{ status: 422, errors }`. On 401 throw `{ status: 401 }`.

---

### M0 gate

- [ ] `bundle exec rspec` passes
- [ ] `npm test` and `npm run build` pass
- [ ] Document local env: `VITE_API_URL`, `CORS_ORIGINS`, encryption key env vars

---

## Milestone 1 — Identity (FR-1, FR-2 core)

**Done when:** Two Get started flows create two isolated companies; duplicate email is 422; Sign in sets cookie; `GET /session` returns user + `has_entity: false`; Sign out clears cookie; FE shows Get started and Sign in together while signed out.

### Task M1.1: Companies + Users schema and models

**Files:**
- Create migration for `companies` and `users` (columns per BE architecture)
- Create: `app/models/company.rb`, `app/models/user.rb`
- Test: `spec/models/user_spec.rb`, `spec/models/company_spec.rb`

**Interfaces:**
- Produces: `Company#payroll_day` default 31; `User` with `has_secure_password`, `access_role` enum-like `admin`/`hr`, unique email
- Produces: `PayrollCalendar.next_payroll_on(payroll_day:, from_time: Time.now.utc) -> Date`

- [ ] **Step 1: Failing calendar unit test**

```ruby
# spec/services/payroll_calendar_spec.rb
RSpec.describe PayrollCalendar do
  describe ".payroll_on" do
    it "uses the last day when the day is missing in a short month" do
      expect(described_class.payroll_on(Date.new(2026, 2, 1), 31)).to eq(Date.new(2026, 2, 28))
    end
  end

  describe ".next_future_payroll_on" do
    it "skips a payroll instant that has already passed today UTC" do
      travel_to Time.utc(2026, 3, 31, 12, 0, 0) do
        expect(described_class.next_future_payroll_on(31)).to eq(Date.new(2026, 4, 30))
      end
    end
  end
end
```

- [ ] **Step 2: Implement `app/services/payroll_calendar.rb`** until green
- [ ] **Step 3: Migrations + models** with validations from architecture; run model specs

---

### Task M1.2: Sign up + session API

**Files:**
- Create: `app/controllers/sign_ups_controller.rb`, `app/controllers/sessions_controller.rb`
- Modify: `app/controllers/application_controller.rb`
- Modify: `config/routes.rb`
- Test: `spec/requests/sign_ups_spec.rb`, `spec/requests/sessions_spec.rb`
- Create: `spec/support/auth_helpers.rb`

**Interfaces:**
- Consumes: `Company`, `User`, `PayrollCalendar`
- Produces:
  - `POST /sign_up` body `{ legal_name, primary_currency, payroll_day, name, email, password }` → 201 + session cookie + user JSON
  - `POST /session` `{ email, password }` → 200 + cookie; bad creds → 401
  - `DELETE /session` → 204
  - `GET /session` → `{ user: { id, name, email, access_role, entity_id }, company: { id, has_entity } }`

- [ ] **Step 1: Write failing request specs** covering: creates company + admin; sets `next_payroll_on` to next future date; duplicate email 422; sign-in; wrong password 401; get session; delete session
- [ ] **Step 2: Implement controllers + routes until green**
- [ ] **Step 3: Ensure CSRF is not required** (API-only forgery protection remains off)

Route sketch:
```ruby
post "/sign_up", to: "sign_ups#create"
resource :session, only: %i[show create destroy]
```

---

### Task M1.3: FE Get started + Sign in screens

**Files:**
- Create: `src/pages/GetStartedPage.tsx`, `src/pages/SignInPage.tsx`, `src/hooks/useSession.ts`
- Modify: `src/App.tsx`
- Test: `src/pages/GetStartedPage.test.tsx`, `src/pages/SignInPage.test.tsx`

**Interfaces:**
- Consumes: `POST /sign_up`, `POST /session`, `GET /session`
- Produces: Routes `/get-started`, `/sign-in`; after success navigate to `/onboarding` (placeholder ok until M2)

- [ ] **Step 1: Failing test** — signed-out Get started page also shows a Sign in link/control; successful signup navigates to onboarding; taken email shows field error from 422
- [ ] **Step 2: Implement pages + mutations** with TanStack Query; invalidate/refetch session after auth
- [ ] **Step 3: Run** `npm test -- src/pages/GetStartedPage.test.tsx src/pages/SignInPage.test.tsx` — PASS

---

### M1 gate

- [ ] Request specs: two companies isolated by session
- [ ] FE: Get started + Sign in always available while signed out
- [ ] Manual: cookie present in browser after sign-in (`credentials: include`)

---

## Milestone 2 — Organization & access (FR-2 onboarding, FR-3–8 settings)

**Done when:** Onboarding creates one entity; Admin can PATCH company, create Admin/HR users, CRUD entities (create/rename/delete empty); HR `GET /entities` returns only theirs; HR cannot PATCH company / POST users / POST entities (404 or 403→prefer **404** per architecture); FE nav hides Admin-only links for HR.

### Task M2.1: Entities schema + country currency map

**Files:**
- Migration: `entities` (+ unique `(company_id, id)`)
- Create: `app/models/entity.rb`, `app/services/countries.rb`
- Test: `spec/services/countries_spec.rb`, `spec/models/entity_spec.rb`

**Interfaces:**
- Produces: `Countries.currency_for("India") # => "INR"`; entity validates country in the nine; currency derived on create

---

### Task M2.2: Entities + company + users API + HR scoping

**Files:**
- Controllers: `entities_controller.rb`, `companies_controller.rb`, `users_controller.rb`
- Modify: `application_controller.rb` — `current_user`, `require_admin!`, `find_entity!` (404 if HR wrong entity)
- Routes per architecture table
- Tests: `spec/requests/entities_spec.rb`, `companies_spec.rb`, `users_spec.rb`, `authorization_spec.rb`

**Interfaces:**
- Produces:
  - `GET/PATCH /company` Admin
  - `GET/POST /users` Admin; HR create requires `entity_id` in company
  - `GET/POST /entities`, `GET/PATCH/DELETE /entities/:id`
  - Delete entity rejected when any payslip exists (enforce fully in M5; for now reject if payslips association nonempty)
  - On first entity create: if `company.next_payroll_on` is already past, advance to next future payroll date (missed month not credited)

- [ ] **Step 1: Failing authz specs** — second company Admin gets 404 for first company’s entity; HR user gets 404 for sibling entity
- [ ] **Step 2: Implement until green**

---

### Task M2.3: FE onboarding, company, users, entities, shell nav

**Files:**
- Pages: `OnboardingPage.tsx`, `CompanyPage.tsx`, `UsersPage.tsx`, `EntitiesPage.tsx`, `EntityDetailPage.tsx`
- `AppShell.tsx`, route guards based on `useSession`
- Tests covering: Admin with `has_entity: false` forced to `/onboarding`; HR nav omits company, users, account analytics

**Routes to wire:** `/onboarding`, `/`, `/company`, `/users`, `/entities`, `/entities/:id` (analytics landing stub ok until M6)

---

### M2 gate

- [ ] Onboarding → entity exists → session `has_entity: true`
- [ ] Admin creates HR for one entity; HR sign-in works
- [ ] HR cannot open `/company` meaningfully (redirect or empty + API 404)
- [ ] Patching `payroll_day` does **not** change `next_payroll_on` (request spec)

---

## Milestone 3 — Rules & calculator (FR-16–20 preview)

**Done when:** Calculator unit specs include FR-19 worked example and JPY rounding; preview endpoint writes nothing; FE Rules page posts on-screen rules + typed gross and renders API lines/net/employer cost without local math.

### Task M3.1: `pay_rules` table + model validations

**Files:** migration `pay_rules`; `app/models/pay_rule.rb`; `spec/models/pay_rule_spec.rb`

**Interfaces:**
- Produces: validations for earning=percent only/no ceiling; deduction/employer percent or fixed; ceiling rules per FR-17

---

### Task M3.2: PayCalculator service

**Files:**
- Create: `app/services/pay_calculator.rb`, `app/services/money_rounding.rb`
- Test: `spec/services/pay_calculator_spec.rb`

**Interfaces:**
- Produces:
```ruby
PayCalculator.call(
  rules:,          # array of rule hashes or PayRule-like objects in list order
  gross_minor:,    # Integer
  currency:        # String — for exponent
) # => {
#   earnings: [{ name:, computed_minor:, ... }], # empty if none; omitted/empty if sum != 100 for run mode
#   deductions: [...],
#   employer_contributions: [...],
#   net_minor:,
#   employer_cost_minor:,
#   earnings_valid: true|false
# }
```
- Preview mode: `earnings_valid: false` → raise / result that controller maps to 422
- Run mode (M5): invalid earnings → store no earning lines; still compute deductions/employer

- [ ] **Step 1: Failing worked example (major units 10000 → minor 1_000_000 for USD)**

FR-19: gross 10,000; employee 10%; employer 12% ceiling 8,000; employee fixed 500 → employee percent 1,000; employer 960; net 8,500; employer cost 10,960.

- [ ] **Step 2: Cases** — last earning absorbs remainder; percent ceiling; net floored at 0; JPY exponent 0; empty rules → net=gross
- [ ] **Step 3: Implement until green**

---

### Task M3.3: Pay rules API + preview

**Files:** `pay_rules_controller.rb`; routes; `spec/requests/pay_rules_spec.rb`

**Interfaces:**
- `GET/POST /entities/:id/pay_rules`
- `PATCH/DELETE /entities/:id/pay_rules/:rule_id`
- `PATCH /entities/:id/pay_rules/order` body `{ rule_ids: [] }`
- `POST /entities/:id/pay_rules/preview` body `{ gross_minor, rules: [...] }` — uses calculator; **no DB writes** for payslips

---

### Task M3.4: FE Rules page

**Files:** `src/pages/RulesPage.tsx`, `src/pages/RulesPage.test.tsx`

**Interfaces:**
- Preview = TanStack Query keyed by `{ entityId, grossMinor, rules }`; `queryFn` POSTs preview
- Screen must display response net/employer cost; tests assert POST body includes unsaved edits

---

### M3 gate

- [ ] `bundle exec rspec spec/services/pay_calculator_spec.rb spec/requests/pay_rules_spec.rb` PASS
- [ ] FE test: preview posts on-screen rules PASS

---

## Milestone 4 — Workforce (FR-7, FR-9–15)

**Done when:** Employee create requires complete country bank set; bank stored encrypted; API returns masks; salary correction/revision semantics hold; leave rejects credited months (credited check wired; full credit in M5); country change replaces all bank sets in one transaction or 422.

### Task M4.1: Employees, salary_assignments, leave_days + bank encryption

**Files:** migrations; models; `app/services/bank_details.rb`; `app/services/salary_writer.rb`
- Tests: `spec/services/bank_details_spec.rb`, `spec/services/salary_writer_spec.rb`, model specs

**Interfaces:**
- `BankDetails.validate!(country, hash)` — complete keys only
- `BankDetails.mask(hash)` — holder full; others last-4 / full mask if len < 4
- `Employee` encrypts `bank_payload` (JSON string)
- `SalaryWriter.correct!(employee, amount_minor, open_month:)` / `.revise!(employee, amount_minor, saved_on:)`
- Unset salary = no assignment covering the date; zero is a real assignment

---

### Task M4.2: Employees / salary / leave / country-change API

**Files:** controllers listed in file map; request specs for bank mask, partial bank 422, decryption failure → `{ bank_details: { readable: false } }`, country change transaction, delete employee blocked when payslip exists (association check)

**Interfaces:** wire exact paths from BE architecture API table for employees, salary, salary_revision, leave_days, entity country PATCH

---

### Task M4.3: FE employee screens + bank form

**Files:** `BankFieldsForm.tsx`, `EmployeesPage.tsx`, `EmployeeDetailPage.tsx` + tests (masked bank form; no clear action)

---

### M4 gate

- [ ] Bank ciphertext in DB; mask only in JSON
- [ ] Correction to credited month refused (use factory payslip/entity_credit once M5 tables exist; until then unit-test `SalaryWriter` with a stub `credited?`)
- [ ] Country change without per-employee bank sets → 422

---

## Milestone 5 — Payroll credit (FR-8 clock, FR-11–13, FR-20–23)

**Done when:** Hourly scheduler opens due runs; entity credit jobs write payslips/skips idempotently; batch finish advances `next_payroll_on`; closed entity month rejects leave/salary edits; FE month list shows skips without detail links; payslip detail matches stored lines.

### Task M5.1: Payroll tables

**Files:** migrations for `payroll_runs`, `entity_credits`, `payslips`, `payroll_skips` (and prepare `currency_conversions` table for M6 — can migrate now with model unused)
- Models with uniqueness constraints from architecture

---

### Task M5.2: Entity credit job + payable days

**Files:**
- `app/jobs/entity_credit_job.rb`
- Helper for payable/leave/outside day counts (may live in `app/services/payslip_builder.rb`)
- Tests: job specs + request/integration specs from BE Testing section (who is credited, zero-gross leave, skip, no day in month, empty entity still finishes credit)

**Interfaces:**
- For each employee in entity for `run.month_on`:
  - no employment day in month → no row
  - ≥1 day, salary unset → `payroll_skips` reason `monthly_salary_unset`
  - ≥1 day, salary set → payslip with proration via calculator; lines document rules; unique `(payroll_run_id, employee_id)`
- On commit: mark `entity_credit` credited; enqueue `CurrencyConversionJob` (no-op stub ok until M6)
- `retry_on StandardError, attempts: 5, wait: :polynomially_longer`

---

### Task M5.3: Scheduler + batch finish

**Files:** `app/jobs/payroll_scheduler_job.rb`; `config/recurring.yml`; batch finish callback marking run `credited` and advancing `next_payroll_on`
- Specs: Get started skipped month never credited; payroll_day change leaves frozen date; downtime wake enqueues once; finished entity second execution writes nothing; next month advances only after all entity credits succeed

**Interfaces:**
- Recurring hourly: companies where `Time.now.utc.to_date >= company.next_payroll_on` and month not finished and company has ≥1 entity
- Open `payroll_runs` unique `(company_id, month_on)` status `processing`
- Enqueue entity credits in slices of 50 via batch

---

### Task M5.4: Payslip read APIs + immutability

**Files:** `payroll_runs_controller.rb`, `payslips_controller.rb`; specs that leave/salary/rules edits after entity credit leave payslip unchanged; delete employee/entity rules FR-13/FR-21

---

### Task M5.5: FE payslip screens

**Files:** `PayrollMonthPage.tsx`, `PayslipDetailPage.tsx` + tests (skip row reason, no detail link; detail omits bank fields)

**Routes:** `/entities/:id/payroll/:month`, `/entities/:id/payroll/:month/:payslipId`

---

### M5 gate

- [ ] Force a company `next_payroll_on` to today UTC, run scheduler job, observe payslips
- [ ] Closed month leave POST → 422
- [ ] FE list + detail match API

---

## Milestone 6 — Currency & analytics (FR-24–29)

**Done when:** Matching currencies store rate 1; Frankfurter failure → pending then later backfill for original `payroll_on`; entity analytics in payout currency; account analytics in run primary currency omitting pending entities; empty state copy; SVG charts render API series.

### Task M6.1: Frankfurter client + conversion job

**Files:** `app/services/frankfurter_client.rb`, `app/jobs/currency_conversion_job.rb`, `app/models/currency_conversion.rb`
- Specs with fake client: match → rate 1; missing date → previous business day; failure → pending; later wake fills original date

**Interfaces:**
```ruby
FrankfurterClient#rate(from:, to:, on:) # => { rate: BigDecimal, rate_on: Date }
```
Converted totals = entity payslip sums × rate, rounded once to primary minor units.

Scheduler also enqueues pending conversions each hour.

---

### Task M6.2: Analytics services + API

**Files:** `app/services/analytics/entity_analytics.rb`, `account_analytics.rb`, `analytics_controller.rb`
- Specs: headcount includes zero-gross; skips excluded; pending entity omitted from account totals and listed by name; empty before first credit

**Interfaces:**
- `GET /entities/:id/analytics`
- `GET /analytics` Admin only

Response shapes (lock these in request specs):

Entity:
```json
{
  "currency": "USD",
  "latest": { "month_on": "2026-03-01", "headcount": 2, "gross_minor": 0, "net_minor": 0, "employer_cost_minor": 0 },
  "series": [{ "month_on": "...", "gross_minor": 0, "net_minor": 0, "employer_cost_minor": 0 }],
  "rule_totals": [{ "name": "...", "side": "employee_deduction", "amount_minor": 0 }],
  "empty": false
}
```

Account: same headlines in primary currency + `employer_cost_by_entity` + `pending_entity_names` + `empty`.

---

### Task M6.3: FE analytics + charts

**Files:** `AnalyticsPage.tsx`, `EntityAnalyticsPage.tsx`, `LineChart.tsx`, `BarChart.tsx` + tests for empty state and pending entity names
- Landing `/` = account analytics for Admin, entity analytics for HR

---

### M6 gate (release “Done when”)

- [ ] All bullets under requirements **Done when** are true
- [ ] Full BE suite green: `bundle exec rspec`
- [ ] Full FE suite green: `npm test` && `npm run build`
- [ ] Spot-check: closed month unchanged after salary/leave/rules/primary currency edits

---

## Cross-cutting task notes

### Authorization helper (use everywhere)

```ruby
# application_controller.rb
def find_entity!(id)
  entity = Entity.find_by(company_id: current_user.company_id, id: id)
  raise ActiveRecord::RecordNotFound unless entity
  if current_user.access_role == "hr" && current_user.entity_id != entity.id
    raise ActiveRecord::RecordNotFound
  end
  entity
end
```

Map `ActiveRecord::RecordNotFound` → 404 JSON.

### FE session 401 behavior

- `GET /session` 401 → stay on Get started / Sign in
- Any other query/mutation 401 → clear cache, navigate `/sign-in`

### Solid Queue in development

Enable queue adapter + supervisor when testing payroll clock locally (see BE architecture Payroll run). Document the exact `config/environments/development.rb` / env flags used in the milestone gate notes when M5 lands.

---

## Self-review (spec coverage)

| Requirement area | Milestone |
|---|---|
| FR-1 Companies / isolation | M1–M2 |
| FR-2 Get started, sign-in, users invite | M1–M2 |
| FR-3 Admin scope | M2+ |
| FR-4 HR scope | M2+ |
| FR-5 Countries / currencies | M2 |
| FR-6 Primary currency | M1–M2 |
| FR-7 Country lock + bank replace | M4 (lock enforced with payslips in M5) |
| FR-8 Payroll day / UTC clock / freeze | M1 calendar + M2 patch + M5 scheduler |
| FR-9–13 Employees, salary, leave, delete | M4–M5 |
| FR-14–15 Bank fields / encryption / mask | M4 |
| FR-16–21 Rules, preview, payslip copy, delete entity | M3 + M5 |
| FR-22–23 Payroll who/closed | M5 |
| FR-24–25 Frankfurter | M6 |
| FR-26–29 Analytics + payslip screens | M5–M6 |
| Outside this release | Explicitly not planned |

**Placeholder scan:** Tasks name concrete paths, interfaces, and verification commands. Where a later milestone completes an earlier check (e.g. delete-with-payslip), the earlier task notes the dependency.

**Type consistency:** Money fields `*_minor` integers; roles `admin`/`hr`; skip reason `monthly_salary_unset`; conversion status `stored`/`pending`; run/credit status `processing`/`credited`; rule sides `earning`/`employee_deduction`/`employer_contribution`; kinds `percent`/`fixed`.

---

## Execution

Plan saved to `docs/plans/salary-manager.md` (canonical). Backend companion: `salary_manager_backend/docs/plans/salary-manager.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks (`superpowers:subagent-driven-development`)
2. **Inline Execution** — this session with `superpowers:executing-plans`, batching with checkpoints

Start at **M0.1** unless a milestone is already complete.
