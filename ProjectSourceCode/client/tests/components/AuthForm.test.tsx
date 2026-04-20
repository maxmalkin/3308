import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AuthForm from "@/components/AuthForm";

const push = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

jest.mock("@/utils/api", () => {
  const actual = jest.requireActual("@/utils/api");
  return {
    ...actual,
    isAuthenticated: jest.fn(() => false),
    setSession: jest.fn(),
    clearSession: jest.fn(),
  };
});

const api = jest.requireMock("@/utils/api") as {
  setSession: jest.Mock;
  isAuthenticated: jest.Mock;
};

const fetchMock = jest.fn();

beforeEach(() => {
  push.mockReset();
  api.setSession.mockReset();
  api.isAuthenticated.mockReset().mockReturnValue(false);
  fetchMock.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
});

function jsonResponse(body: unknown, ok = true, status = ok ? 200 : 400) {
  return {
    ok,
    status,
    json: async () => body,
  } as Response;
}

describe("AuthForm (login)", () => {
  it("submits credentials, stores session, and redirects on success", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ session: "abc" }));
    render(<AuthForm mode="login" />);

    await userEvent.type(screen.getByLabelText(/email/i), "a@b.co");
    await userEvent.type(screen.getByLabelText(/password/i), "hunter2");
    await userEvent.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/auth/login");
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({
      email: "a@b.co",
      password: "hunter2",
    });
    expect(api.setSession).toHaveBeenCalledWith("abc");
    await waitFor(() => expect(push).toHaveBeenCalledWith("/"));
  });

  it("shows an error alert when login fails", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ error: "bad creds" }, false, 401),
    );
    render(<AuthForm mode="login" />);

    await userEvent.type(screen.getByLabelText(/email/i), "a@b.co");
    await userEvent.type(screen.getByLabelText(/password/i), "wrong");
    await userEvent.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("bad creds"),
    );
    expect(api.setSession).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  it("uses a generic error when the server returns no error string", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({}, false, 500));
    render(<AuthForm mode="login" />);

    await userEvent.type(screen.getByLabelText(/email/i), "a@b.co");
    await userEvent.type(screen.getByLabelText(/password/i), "x");
    await userEvent.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(/invalid/i),
    );
  });
});

describe("AuthForm (signup)", () => {
  it("renders username and streaming-service chips in signup mode", () => {
    render(<AuthForm mode="signup" />);
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Netflix" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("toggles a streaming service chip between pressed states", async () => {
    render(<AuthForm mode="signup" />);
    const netflix = screen.getByRole("button", { name: "Netflix" });
    await userEvent.click(netflix);
    expect(netflix).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(netflix);
    expect(netflix).toHaveAttribute("aria-pressed", "false");
  });

  it("submits username, password, email, and selected services", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ session: "new-session" }));
    render(<AuthForm mode="signup" />);

    await userEvent.type(screen.getByLabelText(/username/i), "maren");
    await userEvent.type(screen.getByLabelText(/email/i), "m@studio.com");
    await userEvent.type(screen.getByLabelText(/password/i), "longenough");
    await userEvent.click(screen.getByRole("button", { name: "Netflix" }));
    await userEvent.click(
      screen.getByRole("button", { name: /create account/i }),
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/auth/register");
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({
      email: "m@studio.com",
      password: "longenough",
      username: "maren",
      owned_services: ["Netflix"],
    });
    expect(api.setSession).toHaveBeenCalledWith("new-session");
    await waitFor(() => expect(push).toHaveBeenCalledWith("/"));
  });
});
