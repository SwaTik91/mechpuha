import { DomainError } from "./errors";
import type { FamilyGraph, PersonCard, PersonCardInput, PersonId } from "./types";

export function normalizePersonCard(input: PersonCardInput): PersonCard {
  const name = (input.name ?? "").trim();
  if (!name) throw new DomainError("NAME_REQUIRED");
  const surname = (input.surname ?? "").trim() || null;
  const birthPlace = (input.birthPlace ?? "").trim() || null;
  return { name, surname, birthPlace };
}

export function updatePersonCard(
  graph: FamilyGraph,
  personId: PersonId,
  card: PersonCardInput
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

export function personDisplayName(card: Pick<PersonCard, "name" | "surname">): string {
  return [card.name, card.surname].filter(Boolean).join(" ");
}
