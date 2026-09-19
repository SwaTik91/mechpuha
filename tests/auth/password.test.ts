import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "../../src/auth/password";

describe("password", () => {
  it("accepts the same password and rejects a wrong one", async () => {
    const hash = await hashPassword("секрет-1");
    expect(await verifyPassword("секрет-1", hash)).toBe(true);
    expect(await verifyPassword("нет", hash)).toBe(false);
  });
});
