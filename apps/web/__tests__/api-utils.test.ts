import { describe, it, expect } from "vitest";
import { apiError, apiSuccess, AuthError } from "@/lib/utils/auth";

describe("apiSuccess", () => {
  it("returns 200 with data", () => {
    const res = apiSuccess({ items: [1, 2] });
    expect(res.status).toBe(200);
  });

  it("includes meta", () => {
    const res = apiSuccess([], { page: 1, limit: 20, total: 50 });
    expect(res.status).toBe(200);
  });
});

describe("apiError", () => {
  it("returns 400 by default", () => {
    expect(apiError("Bad request").status).toBe(400);
  });

  it("returns custom status", () => {
    expect(apiError("Not found", 404).status).toBe(404);
    expect(apiError("Server error", 500).status).toBe(500);
  });
});

describe("AuthError", () => {
  it("has correct name and status", () => {
    const err = new AuthError("Unauthorized", 401);
    expect(err.name).toBe("AuthError");
    expect(err.statusCode).toBe(401);
    expect(err.message).toBe("Unauthorized");
  });

  it("defaults to 401", () => {
    const err = new AuthError("No token");
    expect(err.statusCode).toBe(401);
  });
});
