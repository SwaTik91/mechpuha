import { describe, expect, it } from "vitest";
import { layoutGenerations } from "../../src/domain/layout";
import { addRelative, emptyGraph, seedPerson } from "../../src/domain/relations";

describe("layoutGenerations", () => {
  it("places parents above the root and children below", () => {
    let g = emptyGraph();
    g = seedPerson(g, { id: "d", name: "Давид", clan: null, origin: null, claimedUserId: null });
    g = addRelative(g, "d", "father", { name: "Рахамим" });
    g = addRelative(g, "d", "son", { name: "Ноах" });
    const { ancestors, root, descendants } = layoutGenerations(g, "d");
    expect(ancestors[0].map((id) => g.persons.find((p) => p.id === id)!.name)).toContain("Рахамим");
    expect(root).toEqual("d");
    expect(descendants[0].map((id) => g.persons.find((p) => p.id === id)!.name)).toContain("Ноах");
  });

  it("places spouse beside partner after addRelative", () => {
    let g = emptyGraph();
    g = seedPerson(g, { id: "d", name: "Давид", clan: null, origin: null, claimedUserId: null });
    g = addRelative(g, "d", "spouse", { name: "Мирьям" });
    const spouse = g.persons.find((p) => p.name === "Мирьям")!;
    const { rootLevel } = layoutGenerations(g, "d");
    expect(rootLevel).toContain("d");
    expect(rootLevel).toContain(spouse.id);
    expect(rootLevel.indexOf(spouse.id)).toBe(rootLevel.indexOf("d") + 1);
  });

  it("includes grandparents when parents have parents", () => {
    let g = emptyGraph();
    g = seedPerson(g, { id: "d", name: "Давид", clan: null, origin: null, claimedUserId: null });
    g = addRelative(g, "d", "father", { name: "Рахамим" });
    const rahamim = g.persons.find((p) => p.name === "Рахамим")!;
    g = addRelative(g, rahamim.id, "father", { name: "Авраам" });
    const { ancestors } = layoutGenerations(g, "d");
    expect(ancestors).toHaveLength(2);
    expect(ancestors[0].map((id) => g.persons.find((p) => p.id === id)!.name)).toContain("Рахамим");
    expect(ancestors[1].map((id) => g.persons.find((p) => p.id === id)!.name)).toContain("Авраам");
  });
});
