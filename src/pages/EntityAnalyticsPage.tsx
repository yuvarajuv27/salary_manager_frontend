import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "../lib/api";
import AnalyticsContent from "../components/AnalyticsContent";
import type { Entity, EntityAnalyticsResponse } from "../types/api";

export default function EntityAnalyticsPage() {
  const { id } = useParams<{ id: string }>();

  const { data: entity, isLoading: entityLoading } = useQuery({
    queryKey: ["entities", id],
    queryFn: () => apiRequest(`/entities/${id}`) as Promise<Entity>,
    enabled: Boolean(id),
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["analytics", "entity", id],
    queryFn: () =>
      apiRequest(`/entities/${id}/analytics`) as Promise<EntityAnalyticsResponse>,
    enabled: Boolean(id),
  });

  if (entityLoading || analyticsLoading || !entity || !analytics) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <AnalyticsContent
      title={`${entity.name} analytics`}
      description={`Entity-only payroll metrics in ${entity.currency}.`}
      scope="entity"
      data={analytics}
      headerActions={
        <Button variant="outline" size="sm" asChild>
          <Link to={`/entities/${id}`}>← {entity.name}</Link>
        </Button>
      }
    />
  );
}
