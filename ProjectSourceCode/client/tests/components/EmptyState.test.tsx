import { render, screen } from "@testing-library/react";
import EmptyState from "@/components/EmptyState";

describe("EmptyState", () => {
  it("renders title as a heading and the description", () => {
    render(<EmptyState title="Nothing here" description="Try adding a show" />);
    expect(
      screen.getByRole("heading", { name: "Nothing here" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Try adding a show")).toBeInTheDocument();
  });
});
