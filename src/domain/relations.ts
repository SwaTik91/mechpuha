import { DomainError } from "./errors";
import { normalizePersonCard } from "./person";
import type {
  FamilyGraph,
  ParentRelation,
  Person,
  PersonId,
  RelativeKind,
  SpouseRelation,
} from "./types";

export function emptyGraph(): FamilyGraph {
  return { persons: [], relations: [] };
}

export function seedPerson(
  graph: FamilyGraph,
  person: Person
): FamilyGraph {
  return { ...graph, persons: [...graph.persons, person] };
}

function findPerson(graph: FamilyGraph, id: PersonId): Person | undefined {
  return graph.persons.find((p) => p.id === id);
}

function parentRelations(graph: FamilyGraph): ParentRelation[] {
  return graph.relations.filter((r): r is ParentRelation => r.type === "parent");
}

function hasParentRole(graph: FamilyGraph, childId: PersonId, role: "father" | "mother"): boolean {
  return parentRelations(graph).some((r) => r.childId === childId && r.role === role);
}

function getSpouseId(graph: FamilyGraph, personId: PersonId): PersonId | undefined {
  for (const r of graph.relations) {
    if (r.type !== "spouse") continue;
    if (r.a === personId) return r.b;
    if (r.b === personId) return r.a;
  }
  return undefined;
}

function isAncestor(graph: FamilyGraph, personId: PersonId, maybeAncestorId: PersonId): boolean {
  const visited = new Set<PersonId>();
  const queue: PersonId[] = [personId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);

    for (const r of parentRelations(graph)) {
      if (r.childId !== current) continue;
      if (r.parentId === maybeAncestorId) return true;
      queue.push(r.parentId);
    }
  }

  return false;
}

export function linkParent(
  graph: FamilyGraph,
  parentId: PersonId,
  childId: PersonId,
  role: "father" | "mother"
): FamilyGraph {
  if (hasParentRole(graph, childId, role)) {
    throw new DomainError(role === "father" ? "FATHER_EXISTS" : "MOTHER_EXISTS");
  }
  if (isAncestor(graph, parentId, childId)) {
    throw new DomainError("CYCLE");
  }

  const relation: ParentRelation = {
    id: crypto.randomUUID(),
    type: "parent",
    parentId,
    childId,
    role,
  };

  return { ...graph, relations: [...graph.relations, relation] };
}

export function addRelative(
  graph: FamilyGraph,
  fromId: PersonId,
  kind: RelativeKind,
  card: { name?: string; clan?: string; origin?: string }
): FamilyGraph {
  if (!findPerson(graph, fromId)) {
    throw new DomainError("PERSON_NOT_FOUND");
  }

  const normalized = normalizePersonCard(card);
  const newPerson: Person = {
    ...normalized,
    id: crypto.randomUUID(),
    claimedUserId: null,
  };

  let next: FamilyGraph = { ...graph, persons: [...graph.persons, newPerson] };

  switch (kind) {
    case "father":
    case "mother":
      return linkParent(next, newPerson.id, fromId, kind);
    case "spouse": {
      if (getSpouseId(graph, fromId)) {
        throw new DomainError("SPOUSE_EXISTS");
      }
      const relation: SpouseRelation = {
        id: crypto.randomUUID(),
        type: "spouse",
        a: fromId,
        b: newPerson.id,
      };
      return { ...next, relations: [...next.relations, relation] };
    }
    case "son":
    case "daughter":
      return linkParent(next, fromId, newPerson.id, "father");
  }
}
