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

export function layoutGenerations(
  graph: FamilyGraph,
  rootId: PersonId
): {
  ancestors: PersonId[][];
  root: PersonId;
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
    ancestors.push([...next]);
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
    descendants.push([...next]);
    frontier = [...next];
  }

  return { ancestors, root: rootId, descendants };
}

export function hasFather(graph: FamilyGraph, personId: PersonId): boolean {
  return parentRelations(graph).some((r) => r.childId === personId && r.role === "father");
}

export function hasMother(graph: FamilyGraph, personId: PersonId): boolean {
  return parentRelations(graph).some((r) => r.childId === personId && r.role === "mother");
}

export function hasChild(graph: FamilyGraph, personId: PersonId): boolean {
  return getChildren(graph, personId).length > 0;
}
