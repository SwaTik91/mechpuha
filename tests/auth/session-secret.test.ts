import { describe, expect, it } from "vitest";
import { resolveSessionSecret } from "../../src/auth/session-secret";

const FALLBACK = "dev-secret-change-in-production-min-32-chars";

describe("resolveSessionSecret", () => {
  it("uses SESSION_SECRET when it is set", () => {
    expect(
      resolveSessionSecret({ SESSION_SECRET: "from-env-secret-at-least-32-chars!!" }),
    ).toBe("from-env-secret-at-least-32-chars!!");
  });

  it("uses the dev fallback outside production", () => {
    expect(resolveSessionSecret({ NODE_ENV: "development" })).toBe(FALLBACK);
  });

  it("does not throw while Next is collecting a production build", () => {
    expect(
      resolveSessionSecret({
        NODE_ENV: "production",
        NEXT_PHASE: "phase-production-build",
      }),
    ).toBe(FALLBACK);
  });

  it("requires SESSION_SECRET at production runtime", () => {
    expect(() => resolveSessionSecret({ NODE_ENV: "production" })).toThrow(
      /SESSION_SECRET is required in production/,
    );
  });

  it("does not throw on Vercel production when SESSION_SECRET is unset", () => {
    expect(
      resolveSessionSecret({
        NODE_ENV: "production",
        VERCEL: "1",
        VERCEL_PROJECT_ID: "prj_test",
      }),
    ).toBe("vercel:prj_test");
  });
});
