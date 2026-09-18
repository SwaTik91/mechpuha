import { describe, expect, it } from "vitest";
import { readSession, signSession } from "../../src/auth/session";

describe("session", () => {
  it("round-trips a user id and rejects tampering", () => {
    const t = signSession("user-1", "test-secret-at-least-32-chars-long!!");
    expect(readSession(t, "test-secret-at-least-32-chars-long!!")).toBe("user-1");
    expect(readSession(t + "x", "test-secret-at-least-32-chars-long!!")).toBeNull();
  });
});
