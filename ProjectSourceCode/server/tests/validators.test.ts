/**
 * @file Unit tests for zod validators used by the API routes.
 * No mocking required — pure schema behavior.
 */

import { describe, expect, it } from "@jest/globals";
import {
  LoginBodySchema,
  RegisterBodySchema,
} from "../validators/auth.ts";
import {
  ShowIdParamSchema,
  ShowSearchQuerySchema,
} from "../validators/shows.ts";
import { WatchStatusSchema } from "../validators/status.ts";
import {
  AddUserShowBodySchema,
  UpdateUserShowBodySchema,
  UserShowsQuerySchema,
} from "../validators/userShows.ts";

describe("RegisterBodySchema", () => {
  it("accepts a complete valid body and defaults owned_services to []", () => {
    const res = RegisterBodySchema.parse({
      email: "a@b.co",
      password: "secret1",
      username: "maren",
    });
    expect(res.owned_services).toEqual([]);
  });

  it("accepts owned_services when given valid enum values", () => {
    const res = RegisterBodySchema.parse({
      email: "a@b.co",
      password: "secret1",
      username: "maren",
      owned_services: ["Netflix", "Disney+"],
    });
    expect(res.owned_services).toEqual(["Netflix", "Disney+"]);
  });

  it("rejects unknown streaming services", () => {
    const res = RegisterBodySchema.safeParse({
      email: "a@b.co",
      password: "secret1",
      username: "maren",
      owned_services: ["Blockbuster"],
    });
    expect(res.success).toBe(false);
  });

  it("rejects passwords shorter than 6 characters", () => {
    const res = RegisterBodySchema.safeParse({
      email: "a@b.co",
      password: "12345",
      username: "maren",
    });
    expect(res.success).toBe(false);
  });

  it("rejects invalid email addresses", () => {
    const res = RegisterBodySchema.safeParse({
      email: "not-an-email",
      password: "secret1",
      username: "maren",
    });
    expect(res.success).toBe(false);
  });

  it("rejects usernames longer than 32 characters", () => {
    const res = RegisterBodySchema.safeParse({
      email: "a@b.co",
      password: "secret1",
      username: "x".repeat(33),
    });
    expect(res.success).toBe(false);
  });
});

describe("LoginBodySchema", () => {
  it("accepts a valid login body", () => {
    const res = LoginBodySchema.parse({ email: "a@b.co", password: "x" });
    expect(res.email).toBe("a@b.co");
  });

  it("rejects an empty password", () => {
    const res = LoginBodySchema.safeParse({ email: "a@b.co", password: "" });
    expect(res.success).toBe(false);
  });
});

describe("ShowSearchQuerySchema", () => {
  it("coerces page strings into positive integers", () => {
    const res = ShowSearchQuerySchema.parse({ query: "bb", page: "3" });
    expect(res).toEqual({ query: "bb", page: 3 });
  });

  it("defaults page to 1 when omitted", () => {
    const res = ShowSearchQuerySchema.parse({ query: "bb" });
    expect(res.page).toBe(1);
  });

  it("rejects an empty query", () => {
    const res = ShowSearchQuerySchema.safeParse({ query: "" });
    expect(res.success).toBe(false);
  });

  it("rejects zero or negative pages", () => {
    expect(
      ShowSearchQuerySchema.safeParse({ query: "bb", page: "0" }).success,
    ).toBe(false);
    expect(
      ShowSearchQuerySchema.safeParse({ query: "bb", page: "-1" }).success,
    ).toBe(false);
  });
});

describe("ShowIdParamSchema", () => {
  it("coerces a numeric string id", () => {
    expect(ShowIdParamSchema.parse({ id: "1396" })).toEqual({ id: 1396 });
  });

  it("rejects non-numeric ids", () => {
    expect(ShowIdParamSchema.safeParse({ id: "abc" }).success).toBe(false);
  });

  it("rejects non-positive ids", () => {
    expect(ShowIdParamSchema.safeParse({ id: "0" }).success).toBe(false);
  });
});

describe("WatchStatusSchema", () => {
  it.each(["Watched", "In Progress", "Want to Watch"] as const)(
    "accepts %s",
    (v) => {
      expect(WatchStatusSchema.parse(v)).toBe(v);
    },
  );

  it("rejects unknown statuses", () => {
    expect(WatchStatusSchema.safeParse("Abandoned").success).toBe(false);
  });
});

describe("AddUserShowBodySchema", () => {
  it("defaults status to 'Want to Watch'", () => {
    const res = AddUserShowBodySchema.parse({ show_id: 1 });
    expect(res.status).toBe("Want to Watch");
  });

  it("rejects non-integer show ids", () => {
    expect(
      AddUserShowBodySchema.safeParse({ show_id: 1.5 }).success,
    ).toBe(false);
  });

  it("rejects negative show ids", () => {
    expect(AddUserShowBodySchema.safeParse({ show_id: -1 }).success).toBe(
      false,
    );
  });
});

describe("UpdateUserShowBodySchema", () => {
  it("requires a status field", () => {
    expect(UpdateUserShowBodySchema.safeParse({}).success).toBe(false);
  });

  it("accepts a valid status", () => {
    expect(UpdateUserShowBodySchema.parse({ status: "Watched" })).toEqual({
      status: "Watched",
    });
  });
});

describe("UserShowsQuerySchema", () => {
  it("accepts an empty object (status is optional)", () => {
    expect(UserShowsQuerySchema.parse({})).toEqual({});
  });

  it("accepts a valid status filter", () => {
    expect(UserShowsQuerySchema.parse({ status: "In Progress" })).toEqual({
      status: "In Progress",
    });
  });

  it("rejects an unknown status filter", () => {
    expect(UserShowsQuerySchema.safeParse({ status: "bogus" }).success).toBe(
      false,
    );
  });
});
