import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

function Hello() {
  return <h1>Salary Manager</h1>;
}

describe("smoke", () => {
  it("renders", () => {
    render(<Hello />);
    expect(screen.getByRole("heading", { name: "Salary Manager" })).toBeInTheDocument();
  });
});
