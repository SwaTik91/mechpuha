import { describe, expect, it } from "vitest";
import { DomainError } from "../../src/domain/errors";
import { normalizePersonCard } from "../../src/domain/person";

describe("normalizePersonCard", () => {
  it("requires a name", () => {
    expect(() => normalizePersonCard({ name: "   " })).toThrowError(DomainError);
    try {
      normalizePersonCard({ name: "" });
    } catch (e) {
      expect(e).toMatchObject({ code: "NAME_REQUIRED" });
    }
  });

  it("keeps clan and origin optional and trims", () => {
    expect(normalizePersonCard({ name: "  Давид  ", clan: " Абрамовы ", origin: "" })).toEqual({
      name: "Давид",
      clan: "Абрамовы",
      origin: null,
    });
  });
});
