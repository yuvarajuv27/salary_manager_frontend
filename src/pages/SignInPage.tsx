import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { AuthCardLayout } from "@/components/layout/AuthCardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sessionQueryKey } from "../hooks/useSession";
import { apiRequest } from "../lib/api";
import type { SessionResponse } from "../types/api";

export default function SignInPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);

  const signIn = useMutation({
    mutationFn: (body: { email: string; password: string }) =>
      apiRequest("/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: sessionQueryKey });
      const session = data as SessionResponse;
      navigate(session.company.has_entity ? "/" : "/onboarding");
    },
    onError: (error) => {
      if (
        typeof error === "object" &&
        error !== null &&
        "status" in error &&
        (error as { status: number }).status === 401
      ) {
        setAuthError("Invalid email or password.");
      }
    },
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setAuthError(null);
    signIn.mutate({ email, password });
  }

  return (
    <AuthCardLayout
      title="Sign in"
      footer={
        <p className="text-sm text-muted-foreground">
          New here?{" "}
          <Link
            to="/get-started"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Get started
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {authError ? (
          <p role="alert" className="text-sm text-destructive">
            {authError}
          </p>
        ) : null}
        <Button type="submit" disabled={signIn.isPending} className="w-full">
          Sign in
        </Button>
      </form>
    </AuthCardLayout>
  );
}
