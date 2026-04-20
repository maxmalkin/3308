import { render, screen } from "@testing-library/react";
import { ResourceView } from "@/components/ResourceView";
import type { Resource } from "@/hooks/useApiResource";
import { ApiError } from "@/utils/api";

function resource<T>(overrides: Partial<Resource<T>>): Resource<T> {
  return {
    data: null,
    status: "loading",
    error: null,
    ...overrides,
  } as Resource<T>;
}

describe("ResourceView", () => {
  it("renders the default loading state", () => {
    render(
      <ResourceView resource={resource({ status: "loading" })}>
        {() => <p>READY</p>}
      </ResourceView>,
    );
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    expect(screen.queryByText("READY")).not.toBeInTheDocument();
  });

  it("renders custom loading content", () => {
    render(
      <ResourceView
        resource={resource({ status: "loading" })}
        loading={<p>custom-loading</p>}
      >
        {() => <p>READY</p>}
      </ResourceView>,
    );
    expect(screen.getByText("custom-loading")).toBeInTheDocument();
  });

  it("renders unauth slot when status is unauth", () => {
    render(
      <ResourceView
        resource={resource({ status: "unauth" })}
        unauth={<p>please log in</p>}
      >
        {() => <p>READY</p>}
      </ResourceView>,
    );
    expect(screen.getByText("please log in")).toBeInTheDocument();
  });

  it("renders default ErrorBanner on error", () => {
    render(
      <ResourceView
        resource={resource({
          status: "error",
          error: new ApiError("DB down", 500),
        })}
      >
        {() => <p>READY</p>}
      </ResourceView>,
    );
    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    expect(screen.getByText("DB down")).toBeInTheDocument();
  });

  it("delegates to errorView when provided", () => {
    render(
      <ResourceView
        resource={resource({
          status: "error",
          error: new ApiError("not found", 404),
        })}
        errorView={(err) => <p>status:{err?.status}</p>}
      >
        {() => <p>READY</p>}
      </ResourceView>,
    );
    expect(screen.getByText("status:404")).toBeInTheDocument();
  });

  it("calls children render-prop with data when ready", () => {
    render(
      <ResourceView
        resource={resource<{ name: string }>({
          status: "ready",
          data: { name: "Hello" },
        })}
      >
        {(d) => <p>got:{d.name}</p>}
      </ResourceView>,
    );
    expect(screen.getByText("got:Hello")).toBeInTheDocument();
  });

  it("does not call children when data is null even if status is ready", () => {
    const child = jest.fn(() => <p>rendered</p>);
    render(
      <ResourceView resource={resource({ status: "ready", data: null })}>
        {child}
      </ResourceView>,
    );
    expect(child).not.toHaveBeenCalled();
  });
});
