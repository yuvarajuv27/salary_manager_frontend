import { Navigate, Route, Routes } from "react-router";
import AppShell from "./components/layout/AppShell";
import { useSession } from "./hooks/useSession";
import AnalyticsPage from "./pages/AnalyticsPage";
import CompanyPage from "./pages/CompanyPage";
import EntitiesPage from "./pages/EntitiesPage";
import EntityDetailPage from "./pages/EntityDetailPage";
import GetStartedPage from "./pages/GetStartedPage";
import OnboardingPage from "./pages/OnboardingPage";
import RulesPage from "./pages/RulesPage";
import SignInPage from "./pages/SignInPage";
import UsersPage from "./pages/UsersPage";

function SessionLoading() {
  return <p>Loading…</p>;
}

function RequireSignedOut({ children }: { children: React.ReactNode }) {
  const { data: session, isLoading } = useSession();
  if (isLoading) {
    return <SessionLoading />;
  }
  if (session) {
    return (
      <Navigate
        to={session.company.has_entity ? "/" : "/onboarding"}
        replace
      />
    );
  }
  return children;
}

function RequireSignedIn({ children }: { children: React.ReactNode }) {
  const { data: session, isLoading } = useSession();
  if (isLoading) {
    return <SessionLoading />;
  }
  if (!session) {
    return <Navigate to="/sign-in" replace />;
  }
  return children;
}

function RequireEntity({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  if (!session?.company.has_entity) {
    return <Navigate to="/onboarding" replace />;
  }
  return children;
}

function RequireNoEntity({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  if (session?.company.has_entity) {
    return <Navigate to="/" replace />;
  }
  return children;
}

function AdminOnly({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  if (session?.user.access_role !== "admin") {
    return <Navigate to="/" replace />;
  }
  return children;
}

function AuthenticatedLayout() {
  return (
    <RequireSignedIn>
      <RequireEntity>
        <AppShell />
      </RequireEntity>
    </RequireSignedIn>
  );
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/get-started"
        element={
          <RequireSignedOut>
            <GetStartedPage />
          </RequireSignedOut>
        }
      />
      <Route
        path="/sign-in"
        element={
          <RequireSignedOut>
            <SignInPage />
          </RequireSignedOut>
        }
      />
      <Route
        path="/onboarding"
        element={
          <RequireSignedIn>
            <RequireNoEntity>
              <OnboardingPage />
            </RequireNoEntity>
          </RequireSignedIn>
        }
      />
      <Route element={<AuthenticatedLayout />}>
        <Route path="/" element={<AnalyticsPage />} />
        <Route
          path="/company"
          element={
            <AdminOnly>
              <CompanyPage />
            </AdminOnly>
          }
        />
        <Route
          path="/users"
          element={
            <AdminOnly>
              <UsersPage />
            </AdminOnly>
          }
        />
        <Route path="/entities" element={<EntitiesPage />} />
        <Route path="/entities/:id" element={<EntityDetailPage />} />
        <Route
          path="/entities/:id/analytics"
          element={<p>Entity analytics</p>}
        />
        <Route path="/entities/:id/rules" element={<RulesPage />} />
        <Route path="/entities/:id/employees" element={<p>Employees</p>} />
        <Route path="/entities/:id/payroll" element={<p>Payslips</p>} />
        <Route
          path="/entities/:id/payroll/:month"
          element={<p>Payroll month</p>}
        />
      </Route>
    </Routes>
  );
}
