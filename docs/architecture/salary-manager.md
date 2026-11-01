# Salary Manager — Frontend architecture

Product requirements: [project.md](../requirements/project.md). The server design, database, calculator, payroll run, and API contract are in the [backend architecture](../../../salary_manager_backend/docs/architecture/salary-manager.md).

Each Get started creates a company. A signed-in user sees only that company.

## Context and goals

Admin and HR record employees and pay rules for legal entities in nine countries. On the company’s payroll day the server credits a payslip per eligible employee. This app shows that result, and analytics, in the entity currency and in the company’s primary currency. Employees never sign in. The app collects bank details for a later payout and does not send money.

## Ownership

The React app owns screens, routing, and form state. It sends the rules on the screen, including unsaved edits, and the typed gross. It renders the preview and the payroll result the API returns. It does not calculate money and does not decide who may see an entity. It can hide a link. The API still refuses the request.

Sign-in is an HttpOnly session cookie with `SameSite=Lax`. TanStack Query calls the API with `fetch` and `credentials: "include"`. The cookie is not `SameSite=None`. Amounts on the wire are minor units plus the currency code. The app formats those units for display. JPY shows no decimals. The other currencies show two.

In local development the Vite app and the API are different ports on `localhost`. A deployed app and API must stay on one site so that cookie is sent. This design does not choose a host or a deploy tool.

## Libraries

Screen code is TypeScript. React Router v7 runs in declarative mode: `BrowserRouter`, `Routes`, `Route`, `Link`, and `useNavigate`. It has no loaders, actions, or data router. TanStack Query owns every read and write. Analytics charts use Chart.js (`react-chartjs-2`). UI uses Tailwind CSS and shadcn/ui.

| Package | Use |
|---|---|
| `react`, `react-dom` | UI. |
| `react-router` 7 | Which screen is on screen, and where to go after a save. Declarative mode only. |
| `@tanstack/react-query` | Session, lists, details, previews, and saves. |
| `typescript` | Screen code. |
| `tailwindcss` | Utility styling and design tokens. |
| shadcn/ui (Radix-based components under `src/components/ui`) | Buttons, inputs, tables, dialogs, cards, and related primitives. |
| `chart.js`, `react-chartjs-2` | Entity and account analytics charts. |
| `react-hook-form` | Dirty-aware forms; 422 field errors. |
| `sonner` | Success/error toasts. |

Development:

| Package | Use |
|---|---|
| `vite`, `@vitejs/plugin-react` | Dev server and build. |
| `eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh` | Lint. |
| `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom` | Screen tests. |

This app does not add Axios.

## Shell and visual system

Signed-in `AppShell`:

- Viewport shell (`h-svh`): fixed left sidebar; sticky top bar; main content scrolls
- Full-bleed main (no `#root` max-width); soft cool-gray canvas; teal primary accent
- Admin top-bar entity switcher (FE context + `sessionStorage`); Entity sidebar when an entity is selected (Overview, Employees, Pay rules, Payslips → period list, Entity analytics)
- HR: no switcher; Entity nav uses `session.user.entity_id`; top bar shows the user’s name only
- Each page uses a `PageHeader` (title, optional description, optional primary action)
- Content in white panels / tables

Auth pages (`/get-started`, `/sign-in`): product name as the brand signal; centered card on soft gray; Get started ↔ Sign in cross-links (FR-2).

Visual and interaction patterns:

- Lists → shadcn `Table`; create flows → list-first + Dialog; destructive deletes → `AlertDialog`
- Forms → React Hook Form; Save/Create enabled when dirty; 422 errors under fields; other errors → sonner toast
- Loading → skeletons; empty states → short copy in the panel
- Amounts → format with ISO currency code (e.g. `1,234.56 USD`)
- Employees list → paginated API (`page` / `per_page` / `q`)

Sidebar groups: Overview (analytics), Organization (Company, Users, Entities — role-gated), Entity context (Employees, Rules, Payslips, Entity analytics). Profile is linked from the top bar (`/profile`).

## How a screen gets data

The router picks the screen from the URL. The screen asks TanStack Query for data. A save is a mutation. After it succeeds, the screen invalidates the queries that showed the old data and calls `navigate` when the next URL is different. `GET /session` returning 401 means there is no session. Get started and Sign in stay on the page. A 401 from any other query or mutation sends the user to Sign in. A 422 stays on the form and shows the field errors. Sign out is a mutation that calls `DELETE /session`, clears the query cache, and navigates to Sign in.

| Need | Query or mutation |
|---|---|
| Who is signed in, and whether the company has an entity yet | Query `GET /session`. Admin and HR navigation is read from this result. |
| Get started | Mutation `POST /sign_up`, then navigate to onboarding. |
| Sign in | Mutation `POST /session`, then the session query runs again. |
| Sign out | Mutation `DELETE /session`, then navigate to Sign in. |
| Onboarding | Shown while the session says the company has no entity. Mutation creates that entity. |
| Company, users, entities, employees, leave, payslips, analytics | Query for the list or the detail. Mutation for create, edit, and delete. |
| Rule preview | Query whose key is the rules on the screen and the typed gross. The query function `POST`s the preview. It writes nothing. Saving a rule is a separate mutation. |
| Country change | Mutation that sends the new country and a complete bank set for every existing employee. |
| Open a credited month, or a payslip | Query. A skip row has no detail route. |

The preview query must not compute net, gross, or employer cost in the browser. The response is what the screen shows. Refetch on window focus is left on, so a month credited while the tab was in the background shows up when the user returns.

## Screens

| Screen | Admin | HR |
|---|---|---|
| Get started and Sign in | Both screens are always available while signed out. Get started creates a company and signs in the first Admin. Onboarding then asks for one entity’s name and country. A later sign-in with no entity returns to onboarding. | Sign in only, and only after an Admin has created their name, email, and password. Get started is not an HR path. |
| Sign out | Clears the session and returns to Sign in. | Same. |
| Company | Legal name, primary currency, and pay schedule for their company. | No. |
| Profile | Name, email, optional password. | Same. |
| Users | List and create an Admin, or an HR user for one entity of their company. Search filters the list. | No. |
| Entities | List, create, rename, change country before the first credited payslip, delete only when that entity has no payslip. Search filters the list. | Their entity only. No create, country change, or delete. |
| Rules | Any entity of their company. Add, edit, reorder, delete. The preview sits beside the editor. | Their entity. |
| Employees | Any entity of their company. Name, job role, department, dates, salary, leave, bank details. Delete only when that employee has no payslip. Paginated list with search. | Their entity. |
| Payslips | Any entity of their company. Credited periods list, then a period’s payslips (including skip rows) and a detail page. A skip has no detail page. | Their entity. |
| Analytics | The landing page. Account analytics for the company, and any entity’s analytics. | The landing page. Their entity’s analytics only. No account page. |

Routes: `/get-started`, `/sign-in`, `/onboarding` until the company has an entity, then `/` for analytics. That landing page is account analytics for an Admin and the HR user’s entity analytics for HR. The other routes are `/company`, `/profile`, `/users`, `/entities`, `/entities/:id`, `/entities/:id/rules`, `/entities/:id/employees`, `/entities/:id/employees/:employeeId`, `/entities/:id/payroll`, `/entities/:id/payroll/:month`, and `/entities/:id/payroll/:month/:payslipId`.

Each screen calls the matching route in the backend API through TanStack Query.

### Bank details

The employee form collects the complete field set for the entity’s country. The account holder name is shown in full. Every other field is shown as the mask the API returns. Replacing the stored details means submitting a new complete set. The form has no clear action. A country change, while it is still allowed, asks for a new complete set for every existing employee before it submits.

### Payslip detail

The detail shows payable days, leave days, days outside employment, the monthly salary, and gross. When the saved earning rules summed to 100 percent, it then shows those earning lines, which add up to gross. Names such as Base, HRA, and Allowance are the rule names. It then shows each deduction and employer contribution and the amount it produced, then net and employer cost. It shows the employee’s current job role and department. Bank fields stay off the payslip. Lines are grouped by side: earnings, employee deductions, then employer contributions.

### Analytics

The entity page shows the latest credited month: headcount, gross, net, and employer cost. A line shows gross, net, and employer cost for the last 12 credited months, or fewer when fewer months exist. For the latest month, employee deductions and employer contributions are totaled by rule name and side.

The account page shows the same headline numbers and the same 12-month line in the primary currency. It also shows a bar of employer cost by entity for the latest credited month. An entity the API lists as pending is named and left out of the bars and totals. Before the first credited month, both pages say there is nothing to chart yet.

## Testing

Vitest and Testing Library cover the screens. They check that a screen sends the right request and renders the response. They do not re-test money math.

Cover Get started and Sign in both rendered on the signed-out screens, Get started opening onboarding, a taken email showing an error, an Admin with no entity returning to onboarding after sign-in, the HR navigation omitting company settings, users, and account analytics, the rule preview posting the rules on the screen, a skip row with its reason and no detail link, the masked bank form, and the empty analytics state.

## Risks and constraints

- The session cookie requires the deployed frontend and API to be the same site.
- Hiding a link is not authorization. Every HR-only omission must still survive a direct request, which the API answers with 404.
- The app must not derive net, gross, or employer cost from the rule form. The preview response is the only source of those numbers.
