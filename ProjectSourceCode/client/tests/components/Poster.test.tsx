import { render, screen } from "@testing-library/react";
import Poster from "@/components/Poster";

describe("Poster", () => {
  it("renders an img with the TMDB URL when poster_path is set", () => {
    render(
      <div className="relative aspect-[2/3] w-40">
        <Poster
          show={{
            poster_path: "/abc.jpg",
            name: "Breaking Bad",
            original_name: null,
          }}
          size="w500"
        />
      </div>,
    );
    const img = screen.getByAltText("Breaking Bad") as HTMLImageElement;
    expect(img).toBeInTheDocument();
    const decoded = decodeURIComponent(img.src);
    expect(decoded).toContain("image.tmdb.org/t/p/w500/abc.jpg");
  });

  it('falls back to a "No poster" div when poster_path is null', () => {
    render(
      <div className="relative aspect-[2/3] w-40">
        <Poster
          show={{
            poster_path: null,
            name: "Unknown",
            original_name: null,
          }}
          size="w500"
        />
      </div>,
    );
    expect(screen.getByText("No poster")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("falls back to original_name then Untitled for alt", () => {
    const { rerender } = render(
      <Poster
        show={{
          poster_path: "/a.jpg",
          name: null,
          original_name: "Original",
        }}
        size="w500"
      />,
    );
    expect(screen.getByAltText("Original")).toBeInTheDocument();

    rerender(
      <Poster
        show={{ poster_path: "/a.jpg", name: null, original_name: null }}
        size="w500"
      />,
    );
    expect(screen.getByAltText("Untitled")).toBeInTheDocument();
  });
});
