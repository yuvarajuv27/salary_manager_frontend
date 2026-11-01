import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { PageHeader } from "@/components/layout/PageHeader";
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
import { Skeleton } from "@/components/ui/skeleton";
import { sessionQueryKey } from "../hooks/useSession";
import { apiRequest } from "../lib/api";
import { apply422Errors } from "../lib/rhfErrors";
import { toastError, toastSuccess } from "../lib/toast";
import { isApiError422 } from "../types/api";

type Profile = {
  id: number;
  name: string;
  email: string;
  access_role: "admin" | "hr";
  entity_id: number | null;
};

type ProfileForm = {
  name: string;
  email: string;
  password: string;
};

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: () => apiRequest("/profile") as Promise<Profile>,
  });

  const form = useForm<ProfileForm>({
    defaultValues: { name: "", email: "", password: "" },
  });

  useEffect(() => {
    if (!profile) {
      return;
    }
    form.reset({ name: profile.name, email: profile.email, password: "" });
  }, [profile, form]);

  const saveProfile = useMutation({
    mutationFn: (values: ProfileForm) => {
      const body: Record<string, string> = {
        name: values.name,
        email: values.email,
      };
      if (values.password.trim() !== "") {
        body.password = values.password;
      }
      return apiRequest("/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      await queryClient.invalidateQueries({ queryKey: sessionQueryKey });
      toastSuccess("Profile saved");
      form.reset({
        name: form.getValues("name"),
        email: form.getValues("email"),
        password: "",
      });
    },
    onError: (error) => {
      if (isApiError422(error)) {
        apply422Errors(form.setError, error.errors);
        return;
      }
      toastError("Could not save profile");
    },
  });

  if (isLoading || !profile) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-48 w-full max-w-md" />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Profile"
        description="Update your name, email, and password."
        actions={
          <Button
            type="submit"
            form="profile-form"
            disabled={!form.formState.isDirty || saveProfile.isPending}
          >
            Save
          </Button>
        }
      />
      <div className="space-y-6 p-6">
        <Card>
          <CardHeader>
            <CardTitle>Your details</CardTitle>
            <CardDescription>
              Leave password blank to keep your current password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              id="profile-form"
              className="flex max-w-md flex-col gap-4"
              onSubmit={form.handleSubmit((values) => saveProfile.mutate(values))}
            >
              <div className="flex flex-col gap-2">
                <Label htmlFor="profile_name">Name</Label>
                <Input id="profile_name" {...form.register("name", { required: true })} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="profile_email">Email</Label>
                <Input
                  id="profile_email"
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
                <Label htmlFor="profile_password">New password</Label>
                <Input
                  id="profile_password"
                  type="password"
                  autoComplete="new-password"
                  {...form.register("password")}
                />
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
