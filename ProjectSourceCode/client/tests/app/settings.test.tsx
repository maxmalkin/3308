import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SettingsPage from "@/app/settings/page";

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/settings",
  useParams: () => ({}),
}));

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

type ApiInit = { method?: string; body?: string } | undefined;

function setupApiFetch(
  handler: (path: string, init: ApiInit) => Promise<unknown>,
) {
  api.apiFetch.mockImplementation(handler as unknown as never);
}

const profileResp = {
  user: {
    id: "test-user",
    username: "maxm",
    email: "max@example.com",
    owned_services: ["Netflix"],
  },
};

const settingsResp = {
  settings: {
    user_id: "test-user",
    episode_alerts: true,
    reply_alerts: false,
    updated_at: "2026-04-22T00:00:00Z",
  },
};

beforeEach(() => {
  api.isAuthenticated.mockReset().mockReturnValue(true);
  api.apiFetch.mockReset();
});

describe("SettingsPage", () => {
  it("loads profile and notification settings into the form", async () => {
    setupApiFetch(async (path) => {
      if (path === "user/profile") return profileResp;
      if (path === "notifications/settings") return settingsResp;
      return {};
    });

    render(<SettingsPage />);
    const usernameInput = (await screen.findByLabelText(
      /username/i,
    )) as HTMLInputElement;
    expect(usernameInput.value).toBe("maxm");
    expect((screen.getByLabelText(/email/i) as HTMLInputElement).value).toBe(
      "max@example.com",
    );
    expect(
      screen.getByRole("heading", { name: /services you own/i }),
    ).toBeInTheDocument();
  });

  it("submits profile updates", async () => {
    setupApiFetch(async (path, init) => {
      if (path === "user/profile" && init?.method === "PATCH") return {};
      if (path === "user/profile") return profileResp;
      if (path === "notifications/settings") return settingsResp;
      return {};
    });

    render(<SettingsPage />);
    await screen.findByDisplayValue("maxm");
    await userEvent.click(
      screen.getByRole("button", { name: /save profile/i }),
    );

    await waitFor(() => {
      const patch = api.apiFetch.mock.calls.find(
        (args) =>
          args[0] === "user/profile" &&
          (args[1] as ApiInit)?.method === "PATCH",
      );
      expect(patch).toBeDefined();
      const body = JSON.parse((patch?.[1] as ApiInit)?.body ?? "{}");
      expect(body.username).toBe("maxm");
      expect(body.owned_services).toEqual(["Netflix"]);
    });
  });

  it("saves notification preferences", async () => {
    setupApiFetch(async (path, init) => {
      if (path === "notifications/settings" && init?.method === "PATCH")
        return { settings: settingsResp.settings };
      if (path === "user/profile") return profileResp;
      if (path === "notifications/settings") return settingsResp;
      return {};
    });

    render(<SettingsPage />);
    await screen.findByDisplayValue("maxm");
    await userEvent.click(
      screen.getByRole("button", { name: /save preferences/i }),
    );

    await waitFor(() => {
      const patch = api.apiFetch.mock.calls.find(
        (args) =>
          args[0] === "notifications/settings" &&
          (args[1] as ApiInit)?.method === "PATCH",
      );
      expect(patch).toBeDefined();
      const body = JSON.parse((patch?.[1] as ApiInit)?.body ?? "{}");
      expect(body).toHaveProperty("episode_alerts");
      expect(body).toHaveProperty("reply_alerts");
    });
  });
});
