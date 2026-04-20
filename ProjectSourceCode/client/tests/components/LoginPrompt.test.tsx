import { render, screen } from "@testing-library/react";
import LoginPrompt from "@/components/LoginPrompt";

describe("LoginPrompt", () => {
  it("renders the title, description, and a link to /login", () => {
    render(
      <LoginPrompt title="Sign in required" description="Log in to see this" />,
    );
    expect(
      screen.getByRole("heading", { name: "Sign in required" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Log in to see this")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /log in/i });
    expect(link).toHaveAttribute("href", "/login");
  });
});
