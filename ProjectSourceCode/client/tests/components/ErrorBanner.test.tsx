import { render, screen } from "@testing-library/react";
import ErrorBanner from "@/components/ErrorBanner";

describe("ErrorBanner", () => {
  it("renders the default fallback message when none is provided", () => {
    render(<ErrorBanner />);
    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    expect(screen.getByText(/try again later/i)).toBeInTheDocument();
  });

  it("renders a custom error message", () => {
    render(<ErrorBanner message="DB offline" />);
    expect(screen.getByText("DB offline")).toBeInTheDocument();
  });

  it("falls back to default when message is null", () => {
    render(<ErrorBanner message={null} />);
    expect(screen.getByText(/try again later/i)).toBeInTheDocument();
  });
});
