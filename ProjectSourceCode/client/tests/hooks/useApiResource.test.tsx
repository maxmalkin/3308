import { act, renderHook, waitFor } from "@testing-library/react";
import {
  clearApiResourceCache,
  useApiResource,
} from "@/hooks/useApiResource";
import { ApiError } from "@/utils/api";

jest.mock("@/utils/api", () => {
  const actual = jest.requireActual("@/utils/api");
  return {
    ...actual,
    apiFetch: jest.fn(),
    isAuthenticated: jest.fn(() => true),
  };
});

const api = jest.requireMock("@/utils/api") as {
  apiFetch: jest.Mock;
  isAuthenticated: jest.Mock;
};

beforeEach(() => {
  api.apiFetch.mockReset();
  api.isAuthenticated.mockReset().mockReturnValue(true);
  clearApiResourceCache();
});

describe("useApiResource", () => {
  it("starts in loading and resolves to ready with data", async () => {
    api.apiFetch.mockResolvedValueOnce({ shows: [{ id: 1 }] });
    const { result } = renderHook(() =>
      useApiResource<{ shows: { id: number }[] }>("user/watchlist"),
    );
    expect(result.current.status).toBe("loading");
    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.data).toEqual({ shows: [{ id: 1 }] });
    expect(result.current.error).toBeNull();
  });

  it("maps ApiError(401) to unauth status", async () => {
    api.apiFetch.mockRejectedValueOnce(new ApiError("unauthorized", 401));
    const { result } = renderHook(() => useApiResource("user/watchlist"));
    await waitFor(() => expect(result.current.status).toBe("unauth"));
    expect(result.current.error?.status).toBe(401);
  });

  it("maps non-401 errors to error status with ApiError surfaced", async () => {
    api.apiFetch.mockRejectedValueOnce(new ApiError("boom", 500));
    const { result } = renderHook(() => useApiResource("user/watchlist"));
    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.error?.status).toBe(500);
    expect(result.current.error?.message).toBe("boom");
  });

  it("requireAuth short-circuits to unauth without calling apiFetch", async () => {
    api.isAuthenticated.mockReturnValue(false);
    const { result } = renderHook(() =>
      useApiResource("user/watchlist", { requireAuth: true }),
    );
    await waitFor(() => expect(result.current.status).toBe("unauth"));
    expect(api.apiFetch).not.toHaveBeenCalled();
  });

  it("does nothing when path is null", async () => {
    const { result } = renderHook(() => useApiResource(null));
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.status).toBe("loading");
    expect(api.apiFetch).not.toHaveBeenCalled();
  });

  it("ignores resolution after unmount", async () => {
    let resolve!: (v: unknown) => void;
    api.apiFetch.mockImplementationOnce(
      () =>
        new Promise((r) => {
          resolve = r;
        }),
    );
    const { result, unmount } = renderHook(() => useApiResource("ping"));
    unmount();
    await act(async () => {
      resolve({ ok: true });
    });
    expect(result.current.status).toBe("loading");
  });
});
