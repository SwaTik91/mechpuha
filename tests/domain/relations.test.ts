import { describe, expect, it } from "vitest";
import { addRelative, emptyGraph, linkParent, seedPerson } from "../../src/domain/relations";

function davidGraph() {
  const g = emptyGraph();
  return seedPerson(g, { id: "p-david", name: "Давид", clan: "Абрамовы", origin: "Москва", claimedUserId: null });
}

describe("addRelative", () => {
  it("adds a father and a mother, then rejects a second father", () => {
    let g = davidGraph();
    g = addRelative(g, "p-david", "father", { name: "Рахамим", origin: "Дербент" });
    g = addRelative(g, "p-david", "mother", { name: "Сара", origin: "Куба" });
    expect(g.persons.map((p) => p.name).sort()).toEqual(["Давид", "Рахамим", "Сара"]);
    expect(() => addRelative(g, "p-david", "father", { name: "Другой" })).toThrowError(/FATHER_EXISTS/);
  });

  it("rejects a second spouse", () => {
    let g = davidGraph();
    g = addRelative(g, "p-david", "spouse", { name: "Мирьям" });
    expect(() => addRelative(g, "p-david", "spouse", { name: "Другая" })).toThrowError(/SPOUSE_EXISTS/);
  });

  it("adds a son so the new person is the child", () => {
    let g = davidGraph();
    g = addRelative(g, "p-david", "son", { name: "Ноах" });
    const child = g.persons.find((p) => p.name === "Ноах");
    expect(g.relations).toContainEqual(
      expect.objectContaining({ type: "parent", parentId: "p-david", childId: child!.id })
    );
  });

  it("rejects a parent edge that closes a cycle", () => {
    let g = davidGraph();
    g = addRelative(g, "p-david", "son", { name: "Ноах" });
    const noah = g.persons.find((p) => p.name === "Ноах")!;
    expect(() => linkParent(g, noah.id, "p-david", "father")).toThrowError(/CYCLE/);
  });
});
