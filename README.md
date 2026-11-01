# Salary Manager (Frontend)

React client for **Salary Manager**: multi-company Admin/HR payroll for legal entities in nine countries. Admins and HR maintain company records, employees, pay rules, and payslips. Employees never sign in. The app does not send money; it stores bank details for a later payout.

This repo is the **canonical home for whole-project product requirements**. The API lives in the sibling [salary_manager_backend](../salary_manager_backend) repository.

## What this app does

- Get started / Sign in with an HttpOnly session cookie (`credentials: "include"`)
- Admin: company settings, users, entities, all HR tasks across entities
- HR: one assigned entity (employees, rules, payslips, entity analytics)
- Pay rules with live preview (server calculates; the UI never does money math)
- Workforce: employees, encrypted bank details (masked on read), salary, leave
- Payroll period list and payslip detail from credited runs
- Account analytics (Admin) and entity analytics (Admin/HR), Chart.js charts

## Stack

| Piece | Choice |
|---|---|
| UI | React 19, TypeScript, Vite |
| Routing | React Router 7 (declarative) |
| Data | TanStack Query + `fetch` |
| Styling | Tailwind CSS + shadcn/ui |
| Forms / toasts | React Hook Form, sonner |
| Charts | Chart.js (`react-chartjs-2`) |
| Tests | Vitest + Testing Library |

## Docs

| Path | Purpose |
|---|---|
| [docs/README.md](./docs/README.md) | Docs index for this repo |
| [docs/requirements/project.md](./docs/requirements/project.md) | **Canonical** whole-product requirements (FR-*) |
| [docs/architecture/salary-manager.md](./docs/architecture/salary-manager.md) | Frontend architecture (shell, libraries, screens) |
| [docs/plans/salary-manager.md](./docs/plans/salary-manager.md) | Implementation plan (M0–M6 + post-MVP revisions) |
| [docs/SUPERPOWERS_INSTALL.md](./docs/SUPERPOWERS_INSTALL.md) | Install Superpowers at **project** scope |

Backend architecture and BE plans: `../salary_manager_backend/docs/`.

Feature work follows Superpowers: brainstorm → requirements → architecture → plan → TDD. Do not invent requirements; capture what was approved.

## Local development

### Prerequisites

- Node.js (compatible with the Vite 8 toolchain in `package.json`)
- Backend API running (default `http://localhost:3000`) — see the backend README

### Install and run

```bash
npm install
npm run dev
```

Vite serves on `http://localhost:5173` by default.

Optional env:

| Variable | Default | Meaning |
|---|---|---|
| `VITE_API_URL` | `http://localhost:3000` | Rails API base URL |

Docker (optional):

```bash
docker compose up
```

Compose sets `VITE_API_URL` (default `http://localhost:3000`).

### Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server |
| `npm test` | Vitest once |
| `npm run test:watch` | Vitest watch |
| `npm run build` | Typecheck + production build |
| `npm run lint` | ESLint |

## Related repo

| Repo | Role |
|---|---|
| [salary_manager_backend](../salary_manager_backend) | Rails 8.1 API, payroll clock, calculator, analytics |

Keep FE and API same-site in deployed environments so the session cookie is sent (`SameSite=Lax`).
