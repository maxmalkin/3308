import {
  apiFetch,
  clearSession,
  getSession,
  isAuthenticated,
  setSession,
} from "@/utils/api";

type MockResponseInit = {
  status?: number;
  body?: unknown;
  contentType?: string | null;
};

function mockResponse({
  status = 200,
  body,
  contentType = "application/json",
}: MockResponseInit): Response {
  const headers = new Headers();
  if (contentType) headers.set("Content-Type", contentType);
  const text =
    body === undefined
      ? ""
      : typeof body === "string"
        ? body
        : JSON.stringify(body);
  return {
    status,
    ok: status >= 200 && status < 300,
    headers,
    json: async () => (typeof body === "string" ? JSON.parse(body) : body),
    text: async () => text,
  } as unknown as Response;
}

function futureSession(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    access_token: "access-1",
    refresh_token: "refresh-1",
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    ...overrides,
  };
}

function mockFetchOnce(res: Response | Error) {
  const fn = global.fetch as unknown as jest.Mock;
  if (res instanceof Error) {
    fn.mockImplementationOnce(() => Promise.reject(res));
  } else {
    fn.mockImplementationOnce(() => Promise.resolve(res));
  }
}

beforeEach(() => {
  global.fetch = jest.fn();
});

describe("session helpers", () => {
  it("round-trips a session via localStorage", () => {
    const s = futureSession();
    setSession(s);
    expect(getSession()).toEqual(s);
    expect(isAuthenticated()).toBe(true);
  });

  it("clearSession removes the entry", () => {
    setSession(futureSession());
    clearSession();
    expect(getSession()).toBeNull();
    expect(isAuthenticated()).toBe(false);
  });

  it("returns null for missing required fields", () => {
    window.localStorage.setItem(
      "pillarboxd.session",
      JSON.stringify({ access_token: "only-access" }),
    );
    expect(getSession()).toBeNull();
  });

  it("returns null when stored JSON is malformed", () => {
    window.localStorage.setItem("pillarboxd.session", "not-json");
    expect(getSession()).toBeNull();
  });

  it("setSession(null) clears the entry", () => {
    setSession(futureSession());
    setSession(null);
    expect(window.localStorage.getItem("pillarboxd.session")).toBeNull();
  });
});

describe("apiFetch URL handling", () => {
  it("prepends /api when path is not prefixed", async () => {
    mockFetchOnce(mockResponse({ body: { ok: true } }));
    await apiFetch("user/watchlist");
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/user/watchlist",
      expect.anything(),
    );
  });

  it("leaves path alone when already prefixed", async () => {
    mockFetchOnce(mockResponse({ body: { ok: true } }));
    await apiFetch("/api/user/log");
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/user/log",
      expect.anything(),
    );
  });
});

describe("apiFetch auth header", () => {
  it("attaches Bearer when session exists", async () => {
    setSession(futureSession({ access_token: "abc" }));
    mockFetchOnce(mockResponse({ body: { ok: true } }));
    await apiFetch("user/watchlist");
    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect((init.headers as Headers).get("Authorization")).toBe("Bearer abc");
  });

  it("omits Authorization header when no session", async () => {
    mockFetchOnce(mockResponse({ body: { ok: true } }));
    await apiFetch("shows/1");
    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect((init.headers as Headers).get("Authorization")).toBeNull();
  });
});

describe("apiFetch response handling", () => {
  it("returns parsed JSON for JSON responses", async () => {
    mockFetchOnce(mockResponse({ body: { hello: "world" } }));
    await expect(apiFetch<{ hello: string }>("ping")).resolves.toEqual({
      hello: "world",
    });
  });

  it("returns text body when content-type is not JSON", async () => {
    mockFetchOnce(
      mockResponse({ body: "plain text", contentType: "text/plain" }),
    );
    await expect(apiFetch<string>("ping")).resolves.toBe("plain text");
  });

  it("returns undefined for 204 responses", async () => {
    mockFetchOnce(mockResponse({ status: 204, contentType: null }));
    await expect(apiFetch("ping")).resolves.toBeUndefined();
  });

  it("throws ApiError with status on non-OK response", async () => {
    mockFetchOnce(mockResponse({ status: 500, body: "boom" }));
    await expect(apiFetch("ping")).rejects.toMatchObject({
      name: "ApiError",
      status: 500,
    });
  });

  it("wraps network failure in ApiError(0)", async () => {
    mockFetchOnce(new TypeError("Failed to fetch"));
    await expect(apiFetch("ping")).rejects.toMatchObject({
      name: "ApiError",
      status: 0,
    });
  });
});

describe("apiFetch 401 refresh flow", () => {
  it("refreshes the session on 401 and retries once", async () => {
    setSession(futureSession({ access_token: "old" }));
    mockFetchOnce(mockResponse({ status: 401, body: "unauthorized" }));
    mockFetchOnce(
      mockResponse({
        body: {
          session: {
            access_token: "new",
            refresh_token: "refresh-2",
            expires_at: Math.floor(Date.now() / 1000) + 3600,
          },
          user: { id: "u1" },
        },
      }),
    );
    mockFetchOnce(mockResponse({ body: { ok: true } }));

    const result = await apiFetch<{ ok: boolean }>("user/watchlist");
    expect(result).toEqual({ ok: true });
    const calls = (global.fetch as jest.Mock).mock.calls;
    expect(calls.map((c) => c[0])).toEqual([
      "/api/user/watchlist",
      "/api/auth/refresh",
      "/api/user/watchlist",
    ]);
    expect(getSession()?.access_token).toBe("new");
  });

  it("clears session and throws ApiError(401) on refresh failure", async () => {
    setSession(futureSession({ access_token: "old" }));
    mockFetchOnce(mockResponse({ status: 401 }));
    mockFetchOnce(mockResponse({ status: 401, body: "invalid refresh" }));

    await expect(apiFetch("user/watchlist")).rejects.toMatchObject({
      status: 401,
    });
    expect(getSession()).toBeNull();
  });

  it("dedupes concurrent 401s to a single refresh", async () => {
    setSession(futureSession({ access_token: "old" }));
    const refreshed = {
      session: {
        access_token: "new",
        refresh_token: "refresh-2",
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      },
    };

    const fn = global.fetch as unknown as jest.Mock;
    fn.mockImplementation(async (url: string, init: RequestInit) => {
      if (url === "/api/auth/refresh") return mockResponse({ body: refreshed });
      const authHeader = (init.headers as Headers).get("Authorization");
      if (authHeader === "Bearer old") return mockResponse({ status: 401 });
      return mockResponse({ body: { ok: true, url } });
    });

    const [a, b] = await Promise.all([
      apiFetch("user/watchlist"),
      apiFetch("user/log"),
    ]);
    expect(a).toMatchObject({ ok: true });
    expect(b).toMatchObject({ ok: true });
    const refreshCalls = fn.mock.calls.filter(
      ([url]) => url === "/api/auth/refresh",
    );
    expect(refreshCalls).toHaveLength(1);
  });
});

describe("apiFetch proactive refresh", () => {
  it("refreshes proactively when expires_at is within the leeway window", async () => {
    const now = Math.floor(Date.now() / 1000);
    setSession({
      access_token: "old",
      refresh_token: "r",
      expires_at: now + 10,
    });

    mockFetchOnce(
      mockResponse({
        body: {
          session: {
            access_token: "new",
            refresh_token: "r2",
            expires_at: now + 3600,
          },
        },
      }),
    );
    mockFetchOnce(mockResponse({ body: { ok: true } }));

    await apiFetch("user/watchlist");
    const calls = (global.fetch as jest.Mock).mock.calls;
    expect(calls[0][0]).toBe("/api/auth/refresh");
    expect(calls[1][0]).toBe("/api/user/watchlist");
    const [, init] = calls[1];
    expect((init.headers as Headers).get("Authorization")).toBe("Bearer new");
  });
});
