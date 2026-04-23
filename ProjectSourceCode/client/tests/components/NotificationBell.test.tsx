import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NotificationBell from "@/components/NotificationBell";

jest.mock("@/utils/api", () => {
  const actual = jest.requireActual("@/utils/api");
  return {
    ...actual,
    isAuthenticated: jest.fn(() => true),
    apiFetch: jest.fn(),
  };
});

const api = jest.requireMock("@/utils/api") as {
  isAuthenticated: jest.Mock;
  apiFetch: jest.Mock;
};

type FetchFn = (path: string, init?: { method?: string }) => Promise<unknown>;

function mockApiFetch(handler: FetchFn) {
  api.apiFetch.mockImplementation(handler as unknown as never);
}

const baseList = {
  notifications: [
    {
      id: "a",
      message: "New episode of Severance",
      is_read: false,
      created_at: "2026-04-20T12:00:00Z",
    },
    {
      id: "b",
      message: "Welcome aboard",
      is_read: true,
      created_at: "2026-04-19T12:00:00Z",
    },
  ],
  unreadCount: 1,
  pagination: { total: 2, page: 1, limit: 5, totalPages: 1 },
};

beforeEach(() => {
  api.isAuthenticated.mockReset().mockReturnValue(true);
  api.apiFetch.mockReset();
});

describe("NotificationBell", () => {
  it("renders the unread count badge when notifications exist", async () => {
    mockApiFetch(async () => baseList);
    render(<NotificationBell />);
    expect(
      await screen.findByRole("button", { name: /notifications/i }),
    ).toBeInTheDocument();
    expect(await screen.findByText("1")).toBeInTheDocument();
  });

  it("opens the dropdown and shows messages", async () => {
    mockApiFetch(async () => baseList);
    render(<NotificationBell />);
    await screen.findByText("1");
    await userEvent.click(
      screen.getByRole("button", { name: /notifications/i }),
    );
    expect(
      await screen.findByText(/New episode of Severance/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Welcome aboard/i)).toBeInTheDocument();
  });

  it("marks a notification as read on click", async () => {
    mockApiFetch(async (_path, init) => {
      if (init?.method === "PATCH") return { message: "ok" };
      return baseList;
    });
    render(<NotificationBell />);
    await screen.findByText("1");
    await userEvent.click(
      screen.getByRole("button", { name: /notifications/i }),
    );
    await userEvent.click(await screen.findByText(/New episode of Severance/i));
    await waitFor(() => {
      expect(api.apiFetch).toHaveBeenCalledWith(
        "/api/notifications/a/read",
        expect.objectContaining({ method: "PATCH" }),
      );
    });
  });

  it("clears unread count when 'Mark all read' is clicked", async () => {
    mockApiFetch(async (_path, init) => {
      if (init?.method === "POST") return { updated: 1 };
      return baseList;
    });
    render(<NotificationBell />);
    await screen.findByText("1");
    await userEvent.click(
      screen.getByRole("button", { name: /notifications/i }),
    );
    await userEvent.click(
      await screen.findByRole("button", { name: /mark all read/i }),
    );
    await waitFor(() => {
      expect(api.apiFetch).toHaveBeenCalledWith(
        "/api/notifications/mark-all-read",
        expect.objectContaining({ method: "POST" }),
      );
    });
    await waitFor(() =>
      expect(screen.queryByText("1")).not.toBeInTheDocument(),
    );
  });

  it("renders the empty state when there are no notifications", async () => {
    mockApiFetch(async () => ({
      notifications: [],
      unreadCount: 0,
      pagination: { total: 0, page: 1, limit: 5, totalPages: 1 },
    }));
    render(<NotificationBell />);
    await userEvent.click(
      screen.getByRole("button", { name: /notifications/i }),
    );
    expect(
      await screen.findByText(/you have no notifications yet/i),
    ).toBeInTheDocument();
  });

  it("skips fetching when the user is signed out", async () => {
    api.isAuthenticated.mockReturnValue(false);
    mockApiFetch(async () => baseList);
    render(<NotificationBell />);
    await waitFor(() => expect(api.apiFetch).not.toHaveBeenCalled());
  });
});
