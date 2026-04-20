import { render, screen } from "@testing-library/react";
import ShowCard from "@/components/ShowCard";
import type { Show } from "@/types/show";

function makeShow(overrides: Partial<Show> = {}): Show {
  return {
    id: 42,
    name: "Breaking Bad",
    original_name: null,
    overview: null,
    poster_path: "/p.jpg",
    backdrop_path: null,
    first_air_date: "2008-01-20",
    last_air_date: null,
    popularity: null,
    vote_average: 4.8,
    vote_count: null,
    adult: null,
    original_language: null,
    origin_country: null,
    genre_ids: null,
    status: null,
    type: null,
    number_of_seasons: null,
    number_of_episodes: null,
    in_production: null,
    homepage: null,
    tagline: null,
    episode_run_time: null,
    languages: null,
    genres: [{ id: 1, name: "Crime" }],
    created_by: null,
    networks: null,
    production_companies: null,
    production_countries: null,
    seasons: null,
    spoken_languages: null,
    last_episode_to_air: null,
    next_episode_to_air: null,
    watch_providers_us: null,
    ...overrides,
  };
}

describe("ShowCard", () => {
  it("renders title, year, top genre, rating", () => {
    render(<ShowCard show={makeShow()} />);
    expect(screen.getByText("Breaking Bad")).toBeInTheDocument();
    expect(screen.getByText(/2008/)).toBeInTheDocument();
    expect(screen.getByText(/Crime/)).toBeInTheDocument();
    expect(screen.getByText("4.8")).toBeInTheDocument();
  });

  it("hides rating pill when vote_average is null or 0", () => {
    const { rerender } = render(
      <ShowCard show={makeShow({ vote_average: null })} />,
    );
    expect(screen.queryByText(/^\d\.\d$/)).not.toBeInTheDocument();

    rerender(<ShowCard show={makeShow({ vote_average: 0 })} />);
    expect(screen.queryByText("0.0")).not.toBeInTheDocument();
  });

  it("renders a status pill when status prop is passed", () => {
    render(<ShowCard show={makeShow()} status="Watched" />);
    expect(screen.getByText("Watched")).toBeInTheDocument();
  });

  it("links to /shows/{id}", () => {
    render(<ShowCard show={makeShow({ id: 99 })} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/shows/99");
  });

  it("falls back to original_name then Untitled", () => {
    const { rerender } = render(
      <ShowCard show={makeShow({ name: null, original_name: "Alt Name" })} />,
    );
    expect(screen.getByText("Alt Name")).toBeInTheDocument();

    rerender(<ShowCard show={makeShow({ name: null, original_name: null })} />);
    expect(screen.getByText("Untitled")).toBeInTheDocument();
  });
});
