import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
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
import { apiRequest } from "../lib/api";
import { apply422Errors } from "../lib/rhfErrors";
import { toastError, toastSuccess } from "../lib/toast";
import type { Entity, UserRecord } from "../types/api";
import { isApiError422 } from "../types/api";

type CreateUserForm = {
  name: string;
  email: string;
  password: string;
  access_role: "admin" | "hr";
  entity_id: string;
};

function entityLabel(entities: Entity[], entityId: number | null) {
  if (!entityId) {
    return "—";
  }
  return entities.find((e) => e.id === entityId)?.name ?? `Entity ${entityId}`;
}

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => apiRequest("/users") as Promise<UserRecord[]>,
  });

  const filteredUsers = users.filter((user) => {
    const needle = search.trim().toLowerCase();
    if (!needle) {
      return true;
    }
    return (
      user.name.toLowerCase().includes(needle) ||
      user.email.toLowerCase().includes(needle)
    );
  });

  const { data: entities = [] } = useQuery({
    queryKey: ["entities"],
    queryFn: () => apiRequest("/entities") as Promise<Entity[]>,
  });

  const form = useForm<CreateUserForm>({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      access_role: "hr",
      entity_id: "",
    },
  });

  const accessRole = form.watch("access_role");

  const createUser = useMutation({
    mutationFn: (values: CreateUserForm) => {
      const body: Record<string, unknown> = {
        name: values.name,
        email: values.email,
        password: values.password,
        access_role: values.access_role,
      };
      if (values.access_role === "hr") {
        body.entity_id = Number(values.entity_id);
      }
      return apiRequest("/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      toastSuccess("User created");
      setDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      if (isApiError422(error)) {
        apply422Errors(form.setError, error.errors);
        return;
      }
      toastError("Could not create user");
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Users"
        description="Admin and HR accounts for your organization."
        actions={
          <Button type="button" onClick={() => setDialogOpen(true)}>
            Add user
          </Button>
        }
      />
      <div className="space-y-6 p-6">
        <Card>
          <CardHeader className="gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <CardTitle>All users</CardTitle>
              <CardDescription>
                {users.length === 0
                  ? "No users yet."
                  : `${users.length} user${users.length === 1 ? "" : "s"}.`}
              </CardDescription>
            </div>
            <Input
              aria-label="Search users"
              placeholder="Search by name or email"
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
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Entity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{user.access_role}</Badge>
                    </TableCell>
                    <TableCell>
                      {entityLabel(entities, user.entity_id)}
                    </TableCell>
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
            <DialogTitle>Add user</DialogTitle>
          </DialogHeader>
          <form
            className="flex flex-col gap-4"
            onSubmit={form.handleSubmit((values) => createUser.mutate(values))}
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="user_name">Name</Label>
              <Input id="user_name" {...form.register("name", { required: true })} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="user_email">Email</Label>
              <Input
                id="user_email"
                type="email"
                {...form.register("email", { required: true })}
              />
              {form.formState.errors.email?.message ? (
                <p role="alert" className="text-sm text-destructive">
                  {form.formState.errors.email.message}
                </p>
              ) : null}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="user_password">Password</Label>
              <Input
                id="user_password"
                type="password"
                {...form.register("password", { required: true })}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="access_role">Role</Label>
              <select
                id="access_role"
                className={nativeSelectClassName}
                {...form.register("access_role")}
              >
                <option value="admin">Admin</option>
                <option value="hr">HR</option>
              </select>
            </div>
            {accessRole === "hr" ? (
              <div className="flex flex-col gap-2">
                <Label htmlFor="entity_id">Entity</Label>
                <select
                  id="entity_id"
                  className={nativeSelectClassName}
                  {...form.register("entity_id", { required: true })}
                >
                  <option value="">Select entity</option>
                  {entities.map((entity) => (
                    <option key={entity.id} value={entity.id}>
                      {entity.name}
                    </option>
                  ))}
                </select>
                {form.formState.errors.entity_id?.message ? (
                  <p role="alert" className="text-sm text-destructive">
                    {form.formState.errors.entity_id.message}
                  </p>
                ) : null}
              </div>
            ) : null}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!form.formState.isDirty || createUser.isPending}
              >
                Create user
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
