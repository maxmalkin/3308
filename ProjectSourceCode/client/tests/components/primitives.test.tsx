import { render, screen } from "@testing-library/react";
import EmptyState from "@/components/EmptyState";
import ErrorBanner from "@/components/ErrorBanner";
import LoginPrompt from "@/components/LoginPrompt";

describe("LoginPrompt", () => {
  it("renders title, description, and a link to /login", () => {
    render(<LoginPrompt title="Log in please" description="To continue." />);
    expect(screen.getByText("Log in please")).toBeInTheDocument();
    expect(screen.getByText("To continue.")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /log in/i });
    expect(link).toHaveAttribute("href", "/login");
  });
});

describe("ErrorBanner", () => {
  it("renders the provided message", () => {
    render(<ErrorBanner message="Boom" />);
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("Boom")).toBeInTheDocument();
  });

  it("falls back to a default when no message is given", () => {
    render(<ErrorBanner />);
    expect(screen.getByText(/please try again later/i)).toBeInTheDocument();
  });
});

describe("EmptyState", () => {
  it("renders title and description", () => {
    render(<EmptyState title="Nothing here" description="Add something." />);
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
    expect(screen.getByText("Add something.")).toBeInTheDocument();
  });
});
