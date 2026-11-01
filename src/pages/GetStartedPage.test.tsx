import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router";
import GetStartedPage from "./GetStartedPage";
import OnboardingPage from "./OnboardingPage";
import SignInPage from "./SignInPage";
import { renderWithProviders } from "../test/renderWithProviders";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("GetStartedPage", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(jsonResponse({ status: 401 }, 401))),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function renderPage() {
    return renderWithProviders(
      <Routes>
        <Route path="/get-started" element={<GetStartedPage />} />
        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
      </Routes>,
      { route: "/get-started" },
    );
  }

  it("includes a link to Sign in", () => {
    renderPage();
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/sign-in",
    );
  });

  it("opens onboarding after a successful sign up", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.mocked(fetch);

    fetchMock.mockImplementation((input, init) => {
      const url = String(input);
      if (url.endsWith("/sign_up") && init?.method === "POST") {
        return Promise.resolve(
          jsonResponse(
            {
              user: {
                id: 1,
                name: "Jane Admin",
                email: "jane@example.com",
                access_role: "admin",
                entity_id: null,
              },
              company: { id: 1, has_entity: false },
            },
            201,
          ),
        );
      }
      if (url.endsWith("/session")) {
        return Promise.resolve(
          jsonResponse({
            user: {
              id: 1,
              name: "Jane Admin",
              email: "jane@example.com",
              access_role: "admin",
              entity_id: null,
            },
            company: { id: 1, has_entity: false },
          }),
        );
      }
      return Promise.resolve(jsonResponse({ status: 401 }, 401));
    });

    renderPage();

    await user.type(screen.getByLabelText(/company legal name/i), "Acme Corp");
    await user.selectOptions(screen.getByLabelText(/primary currency/i), "USD");
    await user.clear(screen.getByLabelText(/payroll day/i));
    await user.type(screen.getByLabelText(/payroll day/i), "31");
    await user.type(screen.getByLabelText(/^your name$/i), "Jane Admin");
    await user.type(screen.getByLabelText(/^email$/i), "jane@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.click(screen.getByRole("button", { name: /get started/i }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Onboarding" })).toBeInTheDocument();
    });

    const signUpCall = fetchMock.mock.calls.find(
      ([url, init]) =>
        String(url).endsWith("/sign_up") && init?.method === "POST",
    );
    expect(signUpCall?.[1]?.credentials).toBe("include");
    expect(JSON.parse(String(signUpCall?.[1]?.body))).toMatchObject({
      legal_name: "Acme Corp",
      primary_currency: "USD",
      pay_frequency: "monthly",
      payroll_day: 31,
      name: "Jane Admin",
      email: "jane@example.com",
      password: "password123",
    });
  });

  it("shows a field error when the email is already taken", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.mocked(fetch);

    fetchMock.mockImplementation((input, init) => {
      const url = String(input);
      if (url.endsWith("/sign_up") && init?.method === "POST") {
        return Promise.resolve(
          jsonResponse({ errors: { email: ["has already been taken"] } }, 422),
        );
      }
      return Promise.resolve(jsonResponse({ status: 401 }, 401));
    });

    renderPage();

    await user.type(screen.getByLabelText(/company legal name/i), "Acme Corp");
    await user.selectOptions(screen.getByLabelText(/primary currency/i), "USD");
    await user.type(screen.getByLabelText(/^your name$/i), "Jane Admin");
    await user.type(screen.getByLabelText(/^email$/i), "taken@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.click(screen.getByRole("button", { name: /get started/i }));

    expect(
      await screen.findByText(/has already been taken/i),
    ).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Onboarding" })).not.toBeInTheDocument();
  });
});
