import { DomainError } from "./errors";
import type { FamilyGraph, PersonCard, PersonId } from "./types";

export function normalizePersonCard(input: { name?: string; clan?: string; origin?: string }): PersonCard {
  const name = (input.name ?? "").trim();
  if (!name) throw new DomainError("NAME_REQUIRED");
  const clan = (input.clan ?? "").trim() || null;
  const origin = (input.origin ?? "").trim() || null;
  return { name, clan, origin };
}

export function updatePersonCard(
  graph: FamilyGraph,
  personId: PersonId,
  card: { name?: string; clan?: string; origin?: string }
): FamilyGraph {
  const index = graph.persons.findIndex((p) => p.id === personId);
  if (index === -1) {
    throw new DomainError("PERSON_NOT_FOUND");
  }

  const normalized = normalizePersonCard(card);
  const persons = [...graph.persons];
  persons[index] = { ...persons[index], ...normalized };
  return { ...graph, persons };
}
