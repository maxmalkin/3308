import type { ReactNode } from "react";
import type { Resource } from "@/hooks/useApiResource";
import type { ApiError } from "@/utils/api";
import ErrorBanner from "./ErrorBanner";

export function ResourceView<T>({
  resource,
  unauth,
  loading,
  errorView,
  children,
}: {
  resource: Resource<T>;
  unauth?: ReactNode;
  loading?: ReactNode;
  errorView?: (error: ApiError | null) => ReactNode;
  children: (data: T) => ReactNode;
}): ReactNode {
  if (resource.status === "loading") {
    return loading ?? <p className="text-sm text-gray-500">Loading…</p>;
  }
  if (resource.status === "unauth") {
    return unauth ?? null;
  }
  if (resource.status === "error") {
    return errorView ? (
      errorView(resource.error)
    ) : (
      <ErrorBanner message={resource.error?.message} />
    );
  }
  if (resource.data == null) return null;
  return children(resource.data);
}
