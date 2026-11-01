import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "../hooks/useSession";
import { apiRequest } from "../lib/api";
import AnalyticsContent from "../components/AnalyticsContent";
import type {
  AccountAnalyticsResponse,
  EntityAnalyticsResponse,
} from "../types/api";

export default function AnalyticsPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.access_role === "admin";

  const { data, isLoading } = useQuery({
    queryKey: isAdmin
      ? ["analytics", "account"]
      : ["analytics", "entity", session?.user.entity_id],
    queryFn: () => {
      if (isAdmin) {
        return apiRequest("/analytics") as Promise<AccountAnalyticsResponse>;
      }
      const entityId = session?.user.entity_id;
      if (entityId == null) {
        throw new Error("HR user missing entity");
      }
      return apiRequest(
        `/entities/${entityId}/analytics`,
      ) as Promise<EntityAnalyticsResponse>;
    },
    enabled: Boolean(session && (isAdmin || session.user.entity_id != null)),
  });

  if (isLoading || !data) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <AnalyticsContent
      title={isAdmin ? "Account analytics" : "Analytics"}
      description={
        isAdmin
          ? "Company-wide payroll metrics in the primary currency."
          : "Payroll metrics for your assigned entity."
      }
      scope={isAdmin ? "account" : "entity"}
      data={data}
    />
  );
}
