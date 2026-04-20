import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Navbar from "@/components/Navbar";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/",
  useParams: () => ({}),
}));

jest.mock("@/utils/api", () => {
  const actual = jest.requireActual("@/utils/api");
  return {
    ...actual,
    isAuthenticated: jest.fn(() => false),
    clearSession: jest.fn(),
  };
});

const api = jest.requireMock("@/utils/api") as {
  isAuthenticated: jest.Mock;
  clearSession: jest.Mock;
};

beforeEach(() => {
  api.isAuthenticated.mockReset().mockReturnValue(false);
  api.clearSession.mockReset();
});

describe("Navbar", () => {
  it("renders sign-in and sign-up links when logged out", () => {
    render(<Navbar />);
    expect(screen.getByRole("link", { name: /sign in/i })).toHaveAttribute(
      "href",
      "/login",
    );
    expect(screen.getByRole("link", { name: /sign up/i })).toHaveAttribute(
      "href",
      "/register",
    );
    expect(
      screen.queryByRole("button", { name: /sign out/i }),
    ).not.toBeInTheDocument();
  });

  it("renders logged-in links and sign-out button when authenticated", () => {
    api.isAuthenticated.mockReturnValue(true);
    render(<Navbar />);
    expect(screen.getByRole("link", { name: "Queue" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Log" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Recs" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign out/i }),
    ).toBeInTheDocument();
  });

  it("clears the session when sign-out is clicked", async () => {
    api.isAuthenticated.mockReturnValue(true);
    // Swallow jsdom's "Not implemented: navigation" noise from window.location.assign.
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    render(<Navbar />);
    await userEvent.click(screen.getByRole("button", { name: /sign out/i }));

    expect(api.clearSession).toHaveBeenCalledTimes(1);
    errSpy.mockRestore();
  });
});
