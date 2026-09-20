import { describe, expect, it } from "vitest";
import { collectTreeLinks, coupleRowGroups, layoutTreeConnectors } from "../../src/domain/tree-links";
import { addRelative, emptyGraph, seedPerson } from "../../src/domain/relations";

describe("collectTreeLinks", () => {
  it("labels a married pair as супруги", () => {
    let g = emptyGraph();
    g = seedPerson(g, { id: "d", name: "Давид", surname: null, birthPlace: null, claimedUserId: null });
    g = addRelative(g, "d", "spouse", { name: "Мирьям" });
    const spouse = g.persons.find((p) => p.name === "Мирьям")!;

    expect(collectTreeLinks(g)).toEqual([
      { kind: "spouse", a: "d", b: spouse.id, label: "супруги" },
    ]);
  });

  it("labels a father-child edge as отец", () => {
    let g = emptyGraph();
    g = seedPerson(g, { id: "d", name: "Давид", surname: null, birthPlace: null, claimedUserId: null });
    g = addRelative(g, "d", "father", { name: "Рахамим" });
    const father = g.persons.find((p) => p.name === "Рахамим")!;

    expect(collectTreeLinks(g)).toEqual([
      { kind: "parentage", parents: [father.id], children: ["d"], label: "отец" },
    ]);
  });

  it("labels a mother-child edge as мать", () => {
    let g = emptyGraph();
    g = seedPerson(g, { id: "d", name: "Давид", surname: null, birthPlace: null, claimedUserId: null });
    g = addRelative(g, "d", "mother", { name: "Сара" });
    const mother = g.persons.find((p) => p.name === "Сара")!;

    expect(collectTreeLinks(g)).toEqual([
      { kind: "parentage", parents: [mother.id], children: ["d"], label: "мать" },
    ]);
  });

  it("groups both parents of one child as родители", () => {
    let g = emptyGraph();
    g = seedPerson(g, { id: "d", name: "Давид", surname: null, birthPlace: null, claimedUserId: null });
    g = addRelative(g, "d", "father", { name: "Рахамим" });
    g = addRelative(g, "d", "mother", { name: "Сара" });
    const father = g.persons.find((p) => p.name === "Рахамим")!;
    const mother = g.persons.find((p) => p.name === "Сара")!;

    const links = collectTreeLinks(g);
    expect(links).toContainEqual({
      kind: "parentage",
      parents: expect.arrayContaining([father.id, mother.id]),
      children: ["d"],
      label: "родители",
    });
    expect(links.filter((l) => l.kind === "parentage")).toHaveLength(1);
  });

  it("keeps siblings under one parentage group", () => {
    let g = emptyGraph();
    g = seedPerson(g, { id: "d", name: "Давид", surname: null, birthPlace: null, claimedUserId: null });
    g = addRelative(g, "d", "son", { name: "Ноах" });
    g = addRelative(g, "d", "daughter", { name: "Лия" });
    const noah = g.persons.find((p) => p.name === "Ноах")!;
    const leah = g.persons.find((p) => p.name === "Лия")!;

    expect(collectTreeLinks(g)).toEqual([
      {
        kind: "parentage",
        parents: ["d"],
        children: expect.arrayContaining([noah.id, leah.id]),
        label: "родитель",
      },
    ]);
  });
});

describe("coupleRowGroups", () => {
  it("keeps spouses in one pair so the row can leave room for the marriage line", () => {
    let g = emptyGraph();
    g = seedPerson(g, { id: "d", name: "Давид", surname: null, birthPlace: null, claimedUserId: null });
    g = addRelative(g, "d", "spouse", { name: "Мирьям" });
    const spouse = g.persons.find((p) => p.name === "Мирьям")!;

    expect(coupleRowGroups(g, ["d", spouse.id, "x"])).toEqual([["d", spouse.id], ["x"]]);
  });
});

describe("layoutTreeConnectors", () => {
  it("draws a horizontal spouse line between two cards with a midpoint label", () => {
    const paths = layoutTreeConnectors(
      [{ kind: "spouse", a: "d", b: "m", label: "супруги" }],
      [
        { id: "d", x: 0, y: 40, width: 80, height: 40 },
        { id: "m", x: 120, y: 40, width: 80, height: 40 },
      ]
    );

    expect(paths).toHaveLength(1);
    expect(paths[0].d).toBe("M 80 60 L 120 60");
    expect(paths[0].label).toEqual({ text: "супруги", x: 100, y: 60 });
  });

  it("drops a labeled vertical from one parent to one child", () => {
    const paths = layoutTreeConnectors(
      [{ kind: "parentage", parents: ["p"], children: ["c"], label: "отец" }],
      [
        { id: "p", x: 40, y: 0, width: 80, height: 40 },
        { id: "c", x: 40, y: 100, width: 80, height: 40 },
      ]
    );

    expect(paths[0].d).toBe("M 80 40 L 80 70 L 80 100");
    expect(paths[0].label).toEqual({ text: "отец", x: 80, y: 55 });
  });

  it("joins two children with a T-bar under the parent", () => {
    const paths = layoutTreeConnectors(
      [{ kind: "parentage", parents: ["p"], children: ["c1", "c2"], label: "родитель" }],
      [
        { id: "p", x: 80, y: 0, width: 40, height: 40 },
        { id: "c1", x: 0, y: 100, width: 40, height: 40 },
        { id: "c2", x: 160, y: 100, width: 40, height: 40 },
      ]
    );

    expect(paths[0].d).toBe("M 100 40 L 100 70 M 20 70 L 180 70 M 20 70 L 20 100 M 180 70 L 180 100");
    expect(paths[0].label).toEqual({ text: "родитель", x: 100, y: 55 });
  });

  it("skips a link when a card box is missing", () => {
    expect(
      layoutTreeConnectors([{ kind: "spouse", a: "d", b: "m", label: "супруги" }], [
        { id: "d", x: 0, y: 0, width: 80, height: 40 },
      ])
    ).toEqual([]);
  });

  it("drops from the midpoint between two parents", () => {
    const paths = layoutTreeConnectors(
      [{ kind: "parentage", parents: ["f", "m"], children: ["c"], label: "родители" }],
      [
        { id: "f", x: 0, y: 0, width: 80, height: 40 },
        { id: "m", x: 120, y: 0, width: 80, height: 40 },
        { id: "c", x: 60, y: 100, width: 80, height: 40 },
      ]
    );

    expect(paths[0].d).toBe("M 100 40 L 100 70 L 100 100");
    expect(paths[0].label).toEqual({ text: "родители", x: 100, y: 55 });
  });
});
