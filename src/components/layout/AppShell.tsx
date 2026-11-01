import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { NavLink, Outlet, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { nativeSelectClassName } from "@/lib/nativeSelectClassName";
import { useEntityContext } from "../../hooks/useEntityContext";
import { useSession } from "../../hooks/useSession";
import { apiRequest } from "../../lib/api";
import type { Entity } from "../../types/api";

function navLinkClass(isActive: boolean) {
  return cn(
    "block rounded-md px-3 py-2 text-sm transition-colors",
    isActive
      ? "bg-primary/10 font-medium text-primary"
      : "text-foreground/75 hover:bg-muted hover:text-foreground",
  );
}

function NavGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <p className="px-3 py-1 text-xs font-semibold tracking-wide text-foreground/55 uppercase">
        {label}
      </p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function EntityPayslipsLink({ entityId }: { entityId: number }) {
  return (
    <NavLink
      to={`/entities/${entityId}/payroll`}
      className={({ isActive }) => navLinkClass(isActive)}
    >
      Payslips
    </NavLink>
  );
}

export default function AppShell() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const isAdmin = session?.user.access_role === "admin";
  const { activeEntityId, selectEntity } = useEntityContext();

  const { data: entities = [] } = useQuery({
    queryKey: ["entities"],
    queryFn: () => apiRequest("/entities") as Promise<Entity[]>,
    enabled: Boolean(session),
  });

  const contextEntityId = isAdmin
    ? activeEntityId
    : session?.user.entity_id ?? null;

  const signOut = useMutation({
    mutationFn: () => apiRequest("/session", { method: "DELETE" }),
    onSuccess: () => {
      queryClient.clear();
      navigate("/sign-in");
    },
  });

  return (
    <div className="flex h-svh w-full overflow-hidden text-left">
      <aside className="flex w-60 shrink-0 flex-col border-r border-sidebar-border bg-app-sidebar">
        <div className="border-b border-sidebar-border px-4 py-5">
          <p className="font-heading text-base font-semibold text-foreground">
            Salary Manager
          </p>
        </div>

        <nav
          aria-label="Main"
          className="flex flex-1 flex-col gap-6 overflow-y-auto px-2 py-4"
        >
          <NavGroup label="Overview">
            {isAdmin ? (
              <NavLink to="/" className={({ isActive }) => navLinkClass(isActive)}>
                Account
              </NavLink>
            ) : (
              <NavLink to="/" className={({ isActive }) => navLinkClass(isActive)}>
                Analytics
              </NavLink>
            )}
          </NavGroup>

          <NavGroup label="Organization">
            {isAdmin ? (
              <NavLink
                to="/company"
                className={({ isActive }) => navLinkClass(isActive)}
              >
                Company
              </NavLink>
            ) : null}
            {isAdmin ? (
              <NavLink
                to="/users"
                className={({ isActive }) => navLinkClass(isActive)}
              >
                Users
              </NavLink>
            ) : null}
            <NavLink
              to="/entities"
              className={({ isActive }) => navLinkClass(isActive)}
            >
              Entities
            </NavLink>
          </NavGroup>

          {contextEntityId != null ? (
            <NavGroup label="Entity">
              <NavLink
                to={`/entities/${contextEntityId}`}
                end
                className={({ isActive }) => navLinkClass(isActive)}
              >
                Overview
              </NavLink>
              <NavLink
                to={`/entities/${contextEntityId}/employees`}
                className={({ isActive }) => navLinkClass(isActive)}
              >
                Employees
              </NavLink>
              <NavLink
                to={`/entities/${contextEntityId}/rules`}
                className={({ isActive }) => navLinkClass(isActive)}
              >
                Pay rules
              </NavLink>
              <EntityPayslipsLink entityId={contextEntityId} />
              <NavLink
                to={`/entities/${contextEntityId}/analytics`}
                className={({ isActive }) => navLinkClass(isActive)}
              >
                Entity analytics
              </NavLink>
            </NavGroup>
          ) : null}
        </nav>

        <div className="border-t border-sidebar-border p-2">
          <Button
            type="button"
            variant="ghost"
            className="w-full justify-start"
            onClick={() => signOut.mutate()}
          >
            Sign out
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col bg-app-canvas">
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-border bg-background px-6 py-3">
          <div className="min-w-0">
            {isAdmin ? (
              <div className="flex items-center gap-3">
                <Label htmlFor="entity-switcher" className="shrink-0 text-sm">
                  Entity
                </Label>
                <select
                  id="entity-switcher"
                  aria-label="Entity"
                  className={cn(nativeSelectClassName, "w-64 max-w-full")}
                  value={activeEntityId ?? ""}
                  onChange={(event) => {
                    const value = event.target.value;
                    selectEntity(value === "" ? null : Number(value));
                  }}
                >
                  <option value="">All entities</option>
                  {entities.map((entity) => (
                    <option key={entity.id} value={entity.id}>
                      {entity.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <p className="truncate text-sm text-foreground/70">
                {entities.find((entity) => entity.id === session?.user.entity_id)
                  ?.name ?? "\u00a0"}
              </p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <NavLink to="/profile">{session?.user.name ?? "Profile"}</NavLink>
            </Button>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
