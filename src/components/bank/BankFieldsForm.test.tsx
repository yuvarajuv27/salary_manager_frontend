import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BankFieldsForm from "./BankFieldsForm";
import { emptyBankDraft } from "../../lib/bankFields";

describe("BankFieldsForm", () => {
  it("shows API masks with the account holder name in full", () => {
    render(
      <BankFieldsForm
        country="United States"
        displayed={{
          account_holder_name: "Jane Doe",
          account_number: "7890",
          routing_number: "0021",
        }}
        values={emptyBankDraft("United States")}
        onChange={() => {}}
      />,
    );

    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("7890")).toBeInTheDocument();
    expect(screen.getByText("0021")).toBeInTheDocument();
  });

  it("does not offer a clear action", () => {
    render(
      <BankFieldsForm
        country="United States"
        displayed={{
          account_holder_name: "Jane Doe",
          account_number: "7890",
          routing_number: "0021",
        }}
        values={emptyBankDraft("United States")}
        onChange={() => {}}
      />,
    );

    expect(screen.queryByRole("button", { name: /clear/i })).not.toBeInTheDocument();
  });

  it("calls onChange when the user types a replacement value", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <BankFieldsForm
        country="United States"
        values={emptyBankDraft("United States")}
        onChange={onChange}
      />,
    );

    await user.type(screen.getByLabelText(/account number/i), "1");

    expect(onChange).toHaveBeenCalled();
    const lastCall = onChange.mock.calls.at(-1)?.[0];
    expect(lastCall.account_number).toBe("1");
  });

  it("shows unreadable bank details and still collects a new set", () => {
    render(
      <BankFieldsForm
        country="United States"
        displayed={{ readable: false }}
        values={emptyBankDraft("United States")}
        onChange={() => {}}
      />,
    );

    expect(screen.getByText(/cannot be read/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/account holder name/i)).toBeInTheDocument();
  });
});
