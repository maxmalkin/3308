"use client";

import { useEffect, useState } from "react";
import type { Resource, ResourceStatus } from "@/types/api";
import { ApiError, apiFetch, isAuthenticated } from "@/utils/api";

export type { Resource, ResourceStatus } from "@/types/api";

export function useApiResource<T>(
  path: string | null,
  options: { requireAuth?: boolean } = {},
): Resource<T> {
  const requireAuth = options.requireAuth ?? false;
  const [data, setData] = useState<T | null>(null);
  const [status, setStatus] = useState<ResourceStatus>("loading");
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    if (!path) return;
    if (requireAuth && !isAuthenticated()) {
      setStatus("unauth");
      return;
    }

    let cancelled = false;
    setStatus("loading");
    setError(null);

    apiFetch<T>(path)
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
        setError(apiErr);
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [path, requireAuth]);

  return { data, status, error };
}
