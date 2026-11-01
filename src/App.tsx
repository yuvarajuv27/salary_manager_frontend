import { Navigate, Route, Routes } from "react-router";
import { useSession } from "./hooks/useSession";
import GetStartedPage from "./pages/GetStartedPage";
import OnboardingPage from "./pages/OnboardingPage";
import SignInPage from "./pages/SignInPage";

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

function RequireNoEntity({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  if (session?.company.has_entity) {
    return <Navigate to="/" replace />;
  }
  return children;
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
      <Route path="*" element={<Navigate to="/get-started" replace />} />
    </Routes>
  );
}
