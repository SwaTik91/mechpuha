import { describe, expect, it } from "vitest";
import { resolveDatabasePath } from "../../src/db/database-path";

describe("resolveDatabasePath", () => {
  it("uses DATABASE_PATH when set", () => {
    expect(resolveDatabasePath({ DATABASE_PATH: "/custom.sqlite" }, "/app")).toBe(
      "/custom.sqlite",
    );
  });

  it("keeps the local data file off Vercel", () => {
    expect(resolveDatabasePath({ NODE_ENV: "production" }, "/app")).toBe(
      "/app/data/app.sqlite",
    );
  });

  it("writes under /tmp on Vercel so the function filesystem is writable", () => {
    expect(resolveDatabasePath({ VERCEL: "1" }, "/var/task")).toBe(
      "/tmp/mishpucha.sqlite",
    );
  });
});
