import type { FamilyGraph, ParentRelation, PersonId } from "./types";

function parentRelations(graph: FamilyGraph): ParentRelation[] {
  return graph.relations.filter((r): r is ParentRelation => r.type === "parent");
}

function getParents(graph: FamilyGraph, personId: PersonId): PersonId[] {
  return parentRelations(graph)
    .filter((r) => r.childId === personId)
    .map((r) => r.parentId);
}

function getChildren(graph: FamilyGraph, personId: PersonId): PersonId[] {
  return parentRelations(graph)
    .filter((r) => r.parentId === personId)
    .map((r) => r.childId);
}

export function getSpouseId(graph: FamilyGraph, personId: PersonId): PersonId | undefined {
  for (const r of graph.relations) {
    if (r.type !== "spouse") continue;
    if (r.a === personId) return r.b;
    if (r.b === personId) return r.a;
  }
  return undefined;
}

function expandWithSpouses(graph: FamilyGraph, ids: PersonId[]): PersonId[] {
  const result: PersonId[] = [];
  const seen = new Set<PersonId>();

  for (const id of ids) {
    if (!seen.has(id)) {
      result.push(id);
      seen.add(id);
    }
    const spouseId = getSpouseId(graph, id);
    if (spouseId && !seen.has(spouseId)) {
      result.push(spouseId);
      seen.add(spouseId);
    }
  }

  return result;
}

export function layoutGenerations(
  graph: FamilyGraph,
  rootId: PersonId
): {
  ancestors: PersonId[][];
  root: PersonId;
  rootLevel: PersonId[];
  descendants: PersonId[][];
} {
  const ancestors: PersonId[][] = [];
  let frontier = [rootId];

  while (true) {
    const next = new Set<PersonId>();
    for (const id of frontier) {
      for (const parentId of getParents(graph, id)) {
        next.add(parentId);
      }
    }
    if (next.size === 0) break;
    ancestors.push(expandWithSpouses(graph, [...next]));
    frontier = [...next];
  }

  const descendants: PersonId[][] = [];
  frontier = [rootId];

  while (true) {
    const next = new Set<PersonId>();
    for (const id of frontier) {
      for (const childId of getChildren(graph, id)) {
        next.add(childId);
      }
    }
    if (next.size === 0) break;
    descendants.push(expandWithSpouses(graph, [...next]));
    frontier = [...next];
  }

  return {
    ancestors,
    root: rootId,
    rootLevel: expandWithSpouses(graph, [rootId]),
    descendants,
  };
}

export function hasFather(graph: FamilyGraph, personId: PersonId): boolean {
  return parentRelations(graph).some((r) => r.childId === personId && r.role === "father");
}

export function hasMother(graph: FamilyGraph, personId: PersonId): boolean {
  return parentRelations(graph).some((r) => r.childId === personId && r.role === "mother");
}

export function hasSpouse(graph: FamilyGraph, personId: PersonId): boolean {
  return getSpouseId(graph, personId) !== undefined;
}

export function hasChild(graph: FamilyGraph, personId: PersonId): boolean {
  return getChildren(graph, personId).length > 0;
}
