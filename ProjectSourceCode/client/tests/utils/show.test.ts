import {
  statusPillClass,
  tmdbImageUrl,
  yearFrom,
  yearRange,
} from "@/utils/show";

describe("tmdbImageUrl", () => {
  it("returns null when path is null", () => {
    expect(tmdbImageUrl(null, "w500")).toBeNull();
  });

  it("prefixes the path with each supported size", () => {
    expect(tmdbImageUrl("/abc.jpg", "w300")).toBe(
      "https://image.tmdb.org/t/p/w300/abc.jpg",
    );
    expect(tmdbImageUrl("/abc.jpg", "w500")).toBe(
      "https://image.tmdb.org/t/p/w500/abc.jpg",
    );
    expect(tmdbImageUrl("/abc.jpg", "w780")).toBe(
      "https://image.tmdb.org/t/p/w780/abc.jpg",
    );
    expect(tmdbImageUrl("/abc.jpg", "w1280")).toBe(
      "https://image.tmdb.org/t/p/w1280/abc.jpg",
    );
    expect(tmdbImageUrl("/abc.jpg", "original")).toBe(
      "https://image.tmdb.org/t/p/original/abc.jpg",
    );
  });
});

describe("yearFrom", () => {
  it("extracts the 4-digit year from an ISO date", () => {
    expect(yearFrom("2008-01-20")).toBe("2008");
    expect(yearFrom("2022-12-31T00:00:00.000Z")).toBe("2022");
  });

  it("returns null for null input", () => {
    expect(yearFrom(null)).toBeNull();
  });

  it("returns null when the first 4 chars aren't digits", () => {
    expect(yearFrom("bad-date")).toBeNull();
    expect(yearFrom("")).toBeNull();
    expect(yearFrom("20")).toBeNull();
  });
});

describe("yearRange", () => {
  it("returns null when both dates are missing", () => {
    expect(yearRange(null, null)).toBeNull();
  });

  it("collapses to a single year when start equals end", () => {
    expect(yearRange("2020-01-01", "2020-12-31")).toBe("2020");
  });

  it("renders start – end when both differ", () => {
    expect(yearRange("2008-01-01", "2013-09-29")).toBe("2008 \u2013 2013");
  });

  it("fills missing end with Present", () => {
    expect(yearRange("2008-01-01", null)).toBe("2008 \u2013 Present");
  });

  it("fills missing start with ?", () => {
    expect(yearRange(null, "2013-09-29")).toBe("? \u2013 2013");
  });
});

describe("statusPillClass", () => {
  it("returns distinct classes per status", () => {
    expect(statusPillClass("Watched")).toBe("bg-emerald-600 text-white");
    expect(statusPillClass("In Progress")).toBe("bg-amber-500 text-white");
    expect(statusPillClass("Want to Watch")).toBe("bg-gray-800 text-white");
  });
});
