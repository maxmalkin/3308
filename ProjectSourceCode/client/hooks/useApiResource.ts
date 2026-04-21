"use client";

import { useEffect, useState } from "react";
import type { Resource, ResourceStatus } from "@/types/api";
import { ApiError, apiFetch, isAuthenticated } from "@/utils/api";

export type { Resource, ResourceStatus } from "@/types/api";

const CACHE_TTL_MS = 60_000;
type Entry = { data: unknown; ts: number };
const cache = new Map<string, Entry>();
const inflight = new Map<string, Promise<unknown>>();

export function clearApiResourceCache(prefix?: string) {
  if (!prefix) {
    cache.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
}

export function useApiResource<T>(
  path: string | null,
  options: { requireAuth?: boolean } = {},
): Resource<T> {
  const requireAuth = options.requireAuth ?? false;
  const cached = path ? (cache.get(path) as Entry | undefined) : undefined;
  const _fresh = cached && Date.now() - cached.ts < CACHE_TTL_MS;
  const [data, setData] = useState<T | null>(
    cached ? (cached.data as T) : null,
  );
  const [status, setStatus] = useState<ResourceStatus>(
    cached ? "ready" : "loading",
  );
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    if (!path) return;
    if (requireAuth && !isAuthenticated()) {
      setStatus("unauth");
      return;
    }

    let cancelled = false;
    const cachedNow = cache.get(path) as Entry | undefined;
    const isFresh = cachedNow && Date.now() - cachedNow.ts < CACHE_TTL_MS;

    if (cachedNow) {
      setData(cachedNow.data as T);
      setStatus("ready");
      setError(null);
      if (isFresh) return;
    } else {
      setStatus("loading");
      setError(null);
    }

    let req = inflight.get(path) as Promise<T> | undefined;
    if (!req) {
      req = apiFetch<T>(path).then((d) => {
        cache.set(path, { data: d, ts: Date.now() });
        inflight.delete(path);
        return d;
      });
      req.catch(() => inflight.delete(path));
      inflight.set(path, req as Promise<unknown>);
    }

    req
      .then((d) => {
        if (cancelled) return;
        setData(d);
        setStatus("ready");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const apiErr =
          err instanceof ApiError
            ? err
            : new ApiError(
                err instanceof Error ? err.message : "Request failed",
                0,
              );
        if (apiErr.status === 401) {
          setStatus("unauth");
          setError(apiErr);
          return;
        }
        if (!cachedNow) {
          setError(apiErr);
          setStatus("error");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [path, requireAuth]);

  return { data, status, error };
}
