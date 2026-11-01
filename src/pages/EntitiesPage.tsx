import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { nativeSelectClassName } from "@/lib/nativeSelectClassName";
import { useSession } from "../hooks/useSession";
import { apiRequest } from "../lib/api";
import { COUNTRIES } from "../lib/countries";
import { apply422Errors } from "../lib/rhfErrors";
import { toastError, toastSuccess } from "../lib/toast";
import type { Entity } from "../types/api";
import { isApiError422 } from "../types/api";

type CreateEntityForm = {
  name: string;
  country: string;
};

export default function EntitiesPage() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const isAdmin = session?.user.access_role === "admin";
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data: entities = [], isLoading } = useQuery({
    queryKey: ["entities"],
    queryFn: () => apiRequest("/entities") as Promise<Entity[]>,
  });

  const filteredEntities = entities.filter((entity) =>
    entity.name.toLowerCase().includes(search.trim().toLowerCase()),
  );

  const form = useForm<CreateEntityForm>({
    defaultValues: { name: "", country: COUNTRIES[0] },
  });

  const createEntity = useMutation({
    mutationFn: (body: CreateEntityForm) =>
      apiRequest("/entities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["entities"] });
      toastSuccess("Entity created");
      setDialogOpen(false);
      form.reset({ name: "", country: COUNTRIES[0] });
    },
    onError: (error) => {
      if (isApiError422(error)) {
        apply422Errors(form.setError, error.errors);
        return;
      }
      toastError("Could not create entity");
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Entities"
        description="Legal entities used for payroll and reporting."
        actions={
          isAdmin ? (
            <Button type="button" onClick={() => setDialogOpen(true)}>
              Add entity
            </Button>
          ) : undefined
        }
      />
      <div className="space-y-6 p-6">
        <Card>
          <CardHeader className="gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <CardTitle>All entities</CardTitle>
              <CardDescription>
                {entities.length === 0
                  ? "No entities yet."
                  : `${entities.length} entit${entities.length === 1 ? "y" : "ies"}.`}
              </CardDescription>
            </div>
            <Input
              aria-label="Search entities"
              placeholder="Search by name"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-56"
            />
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Currency</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntities.map((entity) => (
                  <TableRow key={entity.id}>
                    <TableCell className="font-medium">
                      <Link
                        to={`/entities/${entity.id}`}
                        className="text-primary underline-offset-4 hover:underline"
                      >
                        {entity.name}
                      </Link>
                    </TableCell>
                    <TableCell>{entity.country}</TableCell>
                    <TableCell>{entity.currency}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add entity</DialogTitle>
          </DialogHeader>
          <form
            className="flex flex-col gap-4"
            onSubmit={form.handleSubmit((values) => createEntity.mutate(values))}
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="entity_name">Name</Label>
              <Input id="entity_name" {...form.register("name", { required: true })} />
              {form.formState.errors.name?.message ? (
                <p role="alert" className="text-sm text-destructive">
                  {form.formState.errors.name.message}
                </p>
              ) : null}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="entity_country">Country</Label>
              <select
                id="entity_country"
                className={nativeSelectClassName}
                {...form.register("country", { required: true })}
              >
                {COUNTRIES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!form.formState.isDirty || createEntity.isPending}
              >
                Create entity
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
