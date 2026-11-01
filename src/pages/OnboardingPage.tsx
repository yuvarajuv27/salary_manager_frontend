import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { AuthCardLayout } from "@/components/layout/AuthCardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { sessionQueryKey } from "../hooks/useSession";
import { apiRequest } from "../lib/api";
import { COUNTRIES } from "../lib/countries";
import { fieldErrors } from "../lib/formErrors";
import { isApiError422 } from "../types/api";

const selectClassName = cn(
  "h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-2.5 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30",
);

export default function OnboardingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [country, setCountry] = useState<string>(COUNTRIES[0]);
  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});

  const createEntity = useMutation({
    mutationFn: (body: { name: string; country: string }) =>
      apiRequest("/entities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: sessionQueryKey });
      navigate("/");
    },
    onError: (error) => {
      if (isApiError422(error)) {
        const errors = error.errors;
        if (typeof errors === "object" && errors !== null && !Array.isArray(errors)) {
          setFormErrors(errors as Record<string, string[]>);
        }
      }
    },
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormErrors({});
    createEntity.mutate({ name, country });
  }

  return (
    <AuthCardLayout title="Onboarding">
      <p className="text-sm text-muted-foreground">
        Add your company&apos;s first legal entity.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="entity_name">Entity name</Label>
          <Input
            id="entity_name"
            name="entity_name"
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
          <Label htmlFor="country">Country</Label>
          <select
            id="country"
            name="country"
            className={selectClassName}
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
        <Button type="submit" disabled={createEntity.isPending} className="w-full">
          Create entity
        </Button>
      </form>
    </AuthCardLayout>
  );
}
