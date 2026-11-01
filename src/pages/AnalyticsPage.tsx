import { PageHeader } from "@/components/layout/PageHeader";
import { useSession } from "../hooks/useSession";

export default function AnalyticsPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.access_role === "admin";

  return (
    <>
      <PageHeader
        title={isAdmin ? "Account analytics" : "Analytics"}
        description="Charts arrive in a later milestone."
      />
      <div className="p-6 text-sm text-muted-foreground">
        No analytics data yet.
      </div>
    </>
  );
}
