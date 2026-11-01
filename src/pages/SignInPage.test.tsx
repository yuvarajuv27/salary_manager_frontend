import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router";
import SignInPage from "./SignInPage";
import GetStartedPage from "./GetStartedPage";
import OnboardingPage from "./OnboardingPage";
import { renderWithProviders } from "../test/renderWithProviders";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const sessionNoEntity = {
  user: {
    id: 1,
    name: "Jane Admin",
    email: "jane@example.com",
    access_role: "admin" as const,
    entity_id: null,
  },
  company: { id: 1, has_entity: false },
};

describe("SignInPage", () => {
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
        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="/get-started" element={<GetStartedPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
      </Routes>,
      { route: "/sign-in" },
    );
  }

  it("includes a link to Get started", () => {
    renderPage();
    expect(screen.getByRole("link", { name: "Get started" })).toHaveAttribute(
      "href",
      "/get-started",
    );
  });

  it("returns an admin with no entity to onboarding after sign in", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.mocked(fetch);

    fetchMock.mockImplementation((input, init) => {
      const url = String(input);
      if (url.endsWith("/session") && init?.method === "POST") {
        return Promise.resolve(jsonResponse(sessionNoEntity));
      }
      return Promise.resolve(jsonResponse({ status: 401 }, 401));
    });

    renderPage();

    await user.type(screen.getByLabelText(/^email$/i), "jane@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.click(screen.getByRole("button", { name: /^sign in$/i }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Onboarding" })).toBeInTheDocument();
    });

    const sessionCall = fetchMock.mock.calls.find(
      ([url, init]) =>
        String(url).endsWith("/session") && init?.method === "POST",
    );
    expect(sessionCall?.[1]?.credentials).toBe("include");
    expect(JSON.parse(String(sessionCall?.[1]?.body))).toEqual({
      email: "jane@example.com",
      password: "password123",
    });
  });
});
