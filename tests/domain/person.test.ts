import { describe, expect, it } from "vitest";
import { DomainError } from "../../src/domain/errors";
import { normalizePersonCard, updatePersonCard } from "../../src/domain/person";
import { emptyGraph, seedPerson } from "../../src/domain/relations";

describe("normalizePersonCard", () => {
  it("requires a name", () => {
    expect(() => normalizePersonCard({ name: "   " })).toThrowError(DomainError);
    try {
      normalizePersonCard({ name: "" });
    } catch (e) {
      expect(e).toMatchObject({ code: "NAME_REQUIRED" });
    }
  });

  it("keeps surname and birth place optional and trims", () => {
    expect(normalizePersonCard({ name: "  Давид  ", surname: " Абрамов ", birthPlace: "" })).toEqual({
      name: "Давид",
      surname: "Абрамов",
      birthPlace: null,
    });
  });
});

describe("updatePersonCard", () => {
  it("updates an existing person and rejects missing ids", () => {
    let g = emptyGraph();
    g = seedPerson(g, {
      id: "p-david",
      name: "Давид",
      surname: "Абрамов",
      birthPlace: "Москва",
      claimedUserId: null,
    });

    g = updatePersonCard(g, "p-david", { name: "Давид-бен", surname: "Коэн", birthPlace: "Иерусалим" });
    expect(g.persons[0]).toMatchObject({
      id: "p-david",
      name: "Давид-бен",
      surname: "Коэн",
      birthPlace: "Иерусалим",
    });

    expect(() => updatePersonCard(g, "missing", { name: "X" })).toThrowError(/PERSON_NOT_FOUND/);
  });
});
