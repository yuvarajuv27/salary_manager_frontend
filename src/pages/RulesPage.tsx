import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useParams } from "react-router";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { nativeSelectClassName } from "@/lib/nativeSelectClassName";
import { useSession } from "../hooks/useSession";
import { apiRequest } from "../lib/api";
import { grossMajorToMinor } from "../lib/grossInput";
import { formatMinor } from "../lib/money";
import { toastError, toastSuccess } from "../lib/toast";
import type {
  Entity,
  PayPreviewResponse,
  PayRule,
  PayRuleInput,
} from "../types/api";
import { isApiError422 } from "../types/api";

type DraftRule = PayRuleInput & { id: number };

type AddRuleForm = {
  name: string;
  side: PayRule["side"];
  kind: PayRule["kind"];
  percent: string;
  amount_minor: string;
};

function toDraft(rule: PayRule): DraftRule {
  return {
    id: rule.id,
    name: rule.name,
    position: rule.position,
    side: rule.side,
    kind: rule.kind,
    percent: rule.percent,
    amount_minor: rule.amount_minor,
    ceiling_minor: rule.ceiling_minor,
  };
}

function PreviewLines({
  title,
  lines,
  currency,
}: {
  title: string;
  lines: PayPreviewResponse["earnings"];
  currency: string;
}) {
  if (lines.length === 0) {
    return null;
  }

  return (
    <section>
      <h3 className="text-sm font-medium text-foreground">{title}</h3>
      <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
        {lines.map((line) => (
          <li key={`${line.position}-${line.name}`}>
            {line.name}: {formatMinor(line.computed_minor, currency)}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function RulesPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draftRules, setDraftRules] = useState<DraftRule[]>([]);
  const [grossMajor, setGrossMajor] = useState("");

  const { data: entity, isLoading: entityLoading } = useQuery({
    queryKey: ["entities", id],
    queryFn: () => apiRequest(`/entities/${id}`) as Promise<Entity>,
    enabled: Boolean(id),
  });

  const { data: savedRules, isLoading: rulesLoading } = useQuery({
    queryKey: ["payRules", id],
    queryFn: () =>
      apiRequest(`/entities/${id}/pay_rules`) as Promise<PayRule[]>,
    enabled: Boolean(id),
  });

  useEffect(() => {
    if (savedRules) {
      setDraftRules(savedRules.map(toDraft));
    }
  }, [savedRules]);

  const addForm = useForm<AddRuleForm>({
    defaultValues: {
      name: "",
      side: "employee_deduction",
      kind: "percent",
      percent: "10",
      amount_minor: "",
    },
  });
  const addSide = addForm.watch("side");
  const addKind = addForm.watch("kind");

  const createRule = useMutation({
    mutationFn: (values: AddRuleForm) => {
      const body: Record<string, unknown> = {
        name: values.name,
        side: values.side,
        kind: values.side === "earning" ? "percent" : values.kind,
      };
      if (values.side === "earning" || values.kind === "percent") {
        body.percent = values.percent;
      } else {
        body.amount_minor = Number(values.amount_minor);
      }
      return apiRequest(`/entities/${id}/pay_rules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["payRules", id] });
      toastSuccess("Rule created");
      setDialogOpen(false);
      addForm.reset();
    },
    onError: () => toastError("Could not create rule"),
  });

  const deleteRule = useMutation({
    mutationFn: (ruleId: number) =>
      apiRequest(`/entities/${id}/pay_rules/${ruleId}`, { method: "DELETE" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["payRules", id] });
      toastSuccess("Rule deleted");
    },
    onError: () => toastError("Could not delete rule"),
  });

  const saveNames = useMutation({
    mutationFn: async () => {
      if (!savedRules) {
        return;
      }
      await Promise.all(
        draftRules.map((draft) => {
          const original = savedRules.find((rule) => rule.id === draft.id);
          if (!original || original.name === draft.name) {
            return Promise.resolve(null);
          }
          return apiRequest(`/entities/${id}/pay_rules/${draft.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: draft.name }),
          });
        }),
      );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["payRules", id] });
      toastSuccess("Rules saved");
    },
    onError: () => toastError("Could not save rules"),
  });

  const grossMinor = useMemo(() => {
    if (!entity || grossMajor.trim() === "") {
      return null;
    }
    const parsed = Number(grossMajor);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return null;
    }
    return grossMajorToMinor(parsed, entity.currency);
  }, [entity, grossMajor]);

  const {
    data: preview,
    error: previewError,
    isFetching: previewLoading,
  } = useQuery({
    queryKey: ["payRulesPreview", id, grossMinor, draftRules],
    queryFn: () =>
      apiRequest(`/entities/${id}/pay_rules/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gross_minor: grossMinor,
          rules: draftRules.map(({ id: _id, ...rule }) => rule),
        }),
      }) as Promise<PayPreviewResponse>,
    enabled: Boolean(id && grossMinor !== null),
  });

  const previewFieldErrors =
    isApiError422(previewError) &&
    typeof previewError.errors === "object" &&
    previewError.errors !== null &&
    !Array.isArray(previewError.errors)
      ? (previewError.errors as Record<string, string[]>)
      : null;

  const namesDirty =
    !!savedRules &&
    draftRules.some((draft) => {
      const original = savedRules.find((rule) => rule.id === draft.id);
      return original && original.name !== draft.name;
    });

  if (entityLoading || rulesLoading || !entity || savedRules === undefined) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const isAdmin = session?.user.access_role === "admin";
  const canEditRules = isAdmin || session?.user.entity_id === entity.id;

  return (
    <>
      <PageHeader
        title={`Pay rules — ${entity.name}`}
        description="Add, remove, or rename rules and preview payroll."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to={`/entities/${id}`}>{entity.name}</Link>
            </Button>
            {canEditRules ? (
              <>
                <Button type="button" size="sm" onClick={() => setDialogOpen(true)}>
                  Add rule
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={!namesDirty || saveNames.isPending}
                  onClick={() => saveNames.mutate()}
                >
                  Save names
                </Button>
              </>
            ) : null}
          </div>
        }
      />
      <div className="space-y-6 p-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Rules</CardTitle>
              <CardDescription>
                {draftRules.length === 0
                  ? "No rules yet."
                  : `${draftRules.length} rule${draftRules.length === 1 ? "" : "s"}.`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <section aria-label="Rule editor" className="space-y-4">
                <ul className="space-y-4">
                  {draftRules
                    .slice()
                    .sort((a, b) => a.position - b.position)
                    .map((rule) => (
                      <li
                        key={rule.id}
                        className="flex flex-col gap-2 rounded-md border border-border p-3"
                      >
                        <div className="flex flex-col gap-2">
                          <Label htmlFor={`rule_name_${rule.id}`}>Name</Label>
                          <Input
                            id={`rule_name_${rule.id}`}
                            aria-label={`Rule name for position ${rule.position}`}
                            value={rule.name}
                            onChange={(event) =>
                              setDraftRules((current) =>
                                current.map((row) =>
                                  row.id === rule.id
                                    ? { ...row, name: event.target.value }
                                    : row,
                                ),
                              )
                            }
                            disabled={!canEditRules}
                          />
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary">{rule.side}</Badge>
                            <Badge variant="outline">{rule.kind}</Badge>
                          </div>
                          {canEditRules ? (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button type="button" variant="destructive" size="sm">
                                  Remove
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remove rule?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This deletes “{rule.name}” from the entity.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteRule.mutate(rule.id)}
                                  >
                                    Remove
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          ) : null}
                        </div>
                      </li>
                    ))}
                </ul>
              </section>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>
                Enter gross pay to calculate from the current draft rules.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <section aria-label="Preview" className="space-y-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="preview_gross">Preview gross</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="preview_gross"
                      inputMode="decimal"
                      value={grossMajor}
                      onChange={(event) => setGrossMajor(event.target.value)}
                      className="max-w-xs"
                    />
                    <span className="text-sm text-muted-foreground">
                      {entity.currency}
                    </span>
                  </div>
                </div>
                {previewLoading ? (
                  <p className="text-sm text-muted-foreground">Calculating preview…</p>
                ) : null}
                {previewFieldErrors?.earnings?.map((message) => (
                  <p key={message} role="alert" className="text-sm text-destructive">
                    {message}
                  </p>
                ))}
                {preview ? (
                  <div className="space-y-4">
                    <PreviewLines
                      title="Earnings"
                      lines={preview.earnings}
                      currency={entity.currency}
                    />
                    <PreviewLines
                      title="Employee deductions"
                      lines={preview.deductions}
                      currency={entity.currency}
                    />
                    <PreviewLines
                      title="Employer contributions"
                      lines={preview.employer_contributions}
                      currency={entity.currency}
                    />
                    <Separator />
                    <p className="text-sm font-medium">
                      Net: {formatMinor(preview.net_minor, entity.currency)}
                    </p>
                    <p className="text-sm font-medium">
                      Employer cost:{" "}
                      {formatMinor(preview.employer_cost_minor, entity.currency)}
                    </p>
                  </div>
                ) : null}
              </section>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add rule</DialogTitle>
          </DialogHeader>
          <form
            className="flex flex-col gap-4"
            onSubmit={addForm.handleSubmit((values) => createRule.mutate(values))}
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="new_rule_name">Name</Label>
              <Input id="new_rule_name" {...addForm.register("name", { required: true })} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="new_rule_side">Side</Label>
              <select
                id="new_rule_side"
                className={nativeSelectClassName}
                {...addForm.register("side")}
              >
                <option value="earning">Earning</option>
                <option value="employee_deduction">Employee deduction</option>
                <option value="employer_contribution">Employer contribution</option>
              </select>
            </div>
            {addSide !== "earning" ? (
              <div className="flex flex-col gap-2">
                <Label htmlFor="new_rule_kind">Kind</Label>
                <select
                  id="new_rule_kind"
                  className={nativeSelectClassName}
                  {...addForm.register("kind")}
                >
                  <option value="percent">Percent</option>
                  <option value="fixed">Fixed</option>
                </select>
              </div>
            ) : null}
            {addSide === "earning" || addKind === "percent" ? (
              <div className="flex flex-col gap-2">
                <Label htmlFor="new_rule_percent">Percent</Label>
                <Input
                  id="new_rule_percent"
                  {...addForm.register("percent", { required: true })}
                />
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Label htmlFor="new_rule_amount">Amount (minor units)</Label>
                <Input
                  id="new_rule_amount"
                  {...addForm.register("amount_minor", { required: true })}
                />
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!addForm.formState.isDirty || createRule.isPending}
              >
                Create rule
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
