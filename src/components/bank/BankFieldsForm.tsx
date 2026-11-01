import { fieldErrors } from "../../lib/formErrors";
import {
  bankFieldKeysForCountry,
  bankFieldLabel,
  isBankReadable,
  type EmployeeBankDetails,
} from "../../lib/bankFields";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type BankFieldsFormProps = {
  country: string;
  displayed?: EmployeeBankDetails | null;
  values: Record<string, string>;
  onChange: (values: Record<string, string>) => void;
  errors?: Record<string, string[]>;
  idPrefix?: string;
};

export default function BankFieldsForm({
  country,
  displayed,
  values,
  onChange,
  errors = {},
  idPrefix = "bank",
}: BankFieldsFormProps) {
  const keys = bankFieldKeysForCountry(country);

  function updateField(key: string, next: string) {
    onChange({ ...values, [key]: next });
  }

  return (
    <fieldset className="space-y-4 border-0 p-0">
      <legend className="text-base font-medium leading-none">Bank details</legend>
      {displayed && !isBankReadable(displayed) ? (
        <p role="status" className="text-sm text-muted-foreground">
          Stored bank details cannot be read. Enter a new complete set.
        </p>
      ) : null}
      {displayed && isBankReadable(displayed) ? (
        <Card aria-label="Current bank details on file">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">On file</CardTitle>
            <CardDescription>Masked values from the server.</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 text-sm">
              {keys.map((key) => (
                <div key={key} className="grid gap-1">
                  <dt className="text-muted-foreground">{bankFieldLabel(key)}</dt>
                  <dd className="font-medium text-foreground">{displayed[key]}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      ) : null}
      <div
        className="space-y-4"
        aria-label={displayed ? "Replace bank details" : "Bank details"}
      >
        {displayed ? (
          <p className="text-sm font-medium">Replace with a complete set</p>
        ) : null}
        {keys.map((key) => {
          const inputId = `${idPrefix}_${key}`;
          return (
            <div key={key} className="flex flex-col gap-2">
              <Label htmlFor={inputId}>{bankFieldLabel(key)}</Label>
              <Input
                id={inputId}
                name={key}
                value={values[key] ?? ""}
                onChange={(event) => updateField(key, event.target.value)}
                autoComplete="off"
              />
              {fieldErrors(errors, `bank_details.${key}`).map((message) => (
                <p key={message} role="alert" className="text-sm text-destructive">
                  {message}
                </p>
              ))}
              {fieldErrors(errors, key).map((message) => (
                <p key={message} role="alert" className="text-sm text-destructive">
                  {message}
                </p>
              ))}
            </div>
          );
        })}
        {fieldErrors(errors, "bank_details").map((message) => (
          <p key={message} role="alert" className="text-sm text-destructive">
            {message}
          </p>
        ))}
        {fieldErrors(errors, "bank_payload").map((message) => (
          <p key={message} role="alert" className="text-sm text-destructive">
            {message}
          </p>
        ))}
      </div>
    </fieldset>
  );
}
