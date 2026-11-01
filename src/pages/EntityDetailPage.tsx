import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { nativeSelectClassName } from "@/lib/nativeSelectClassName";
import { useSession } from "../hooks/useSession";
import { apiRequest } from "../lib/api";
import { COUNTRIES } from "../lib/countries";
import { fieldErrors } from "../lib/formErrors";
import { toastError, toastSuccess } from "../lib/toast";
import type { Entity } from "../types/api";
import { isApiError422 } from "../types/api";
import { Skeleton } from "@/components/ui/skeleton";

export default function EntityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const isAdmin = session?.user.access_role === "admin";

  const { data: entity, isLoading } = useQuery({
    queryKey: ["entities", id],
    queryFn: () => apiRequest(`/entities/${id}`) as Promise<Entity>,
    enabled: Boolean(id),
  });

  const [name, setName] = useState("");
  const [country, setCountry] = useState<string>(COUNTRIES[0]);
  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (entity) {
      setName(entity.name);
      setCountry(entity.country);
    }
  }, [entity]);

  const saveEntity = useMutation({
    mutationFn: (body: { name: string; country?: string }) =>
      apiRequest(`/entities/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["entities"] });
      toastSuccess("Entity saved");
    },
    onError: (error) => {
      if (isApiError422(error)) {
        const errors = error.errors;
        if (typeof errors === "object" && errors !== null && !Array.isArray(errors)) {
          setFormErrors(errors as Record<string, string[]>);
        }
        return;
      }
      toastError("Could not save entity");
    },
  });

  const deleteEntity = useMutation({
    mutationFn: () =>
      apiRequest(`/entities/${id}`, {
        method: "DELETE",
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["entities"] });
      toastSuccess("Entity deleted");
      navigate("/entities");
    },
    onError: () => toastError("Could not delete entity"),
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormErrors({});
    const body: { name: string; country?: string } = { name };
    if (isAdmin) {
      body.country = country;
    }
    saveEntity.mutate(body);
  }

  if (isLoading || !entity) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-48 w-full max-w-md" />
      </div>
    );
  }

  const isDirty =
    name !== entity.name || (isAdmin && country !== entity.country);

  return (
    <>
      <PageHeader
        title={entity.name}
        description={
          isAdmin
            ? "Update entity details or remove this entity."
            : `${entity.country} (${entity.currency})`
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/entities">Entities</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to={`/entities/${id}/rules`}>Pay rules</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to={`/entities/${id}/employees`}>Employees</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to={`/entities/${id}/analytics`}>Analytics</Link>
            </Button>
          </div>
        }
      />
      <div className="space-y-6 p-6">
        {isAdmin ? (
          <Card>
            <CardHeader>
              <CardTitle>Entity settings</CardTitle>
              <CardDescription>
                Currency is derived from country and cannot be edited directly.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handleSubmit}
                className="flex max-w-md flex-col gap-4"
              >
                <div className="flex flex-col gap-2">
                  <Label htmlFor="entity_name">Name</Label>
                  <Input
                    id="entity_name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                  {fieldErrors(formErrors, "name").map((message) => (
                    <p key={message} role="alert" className="text-sm text-destructive">
                      {message}
                    </p>
                  ))}
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="entity_country">Country</Label>
                  <select
                    id="entity_country"
                    className={nativeSelectClassName}
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                  >
                    {COUNTRIES.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  {fieldErrors(formErrors, "country").map((message) => (
                    <p key={message} role="alert" className="text-sm text-destructive">
                      {message}
                    </p>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="submit"
                    disabled={!isDirty || saveEntity.isPending}
                  >
                    Save
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        type="button"
                        variant="destructive"
                        disabled={deleteEntity.isPending}
                      >
                        Delete entity
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete entity?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This permanently removes {entity.name} and cannot be
                          undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          variant="destructive"
                          onClick={() => deleteEntity.mutate()}
                        >
                          Delete entity
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Entity summary</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{entity.country}</Badge>
                <Badge variant="outline">{entity.currency}</Badge>
              </div>
              <Separator />
              <p className="text-sm text-muted-foreground">
                Contact an admin to change entity details.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
