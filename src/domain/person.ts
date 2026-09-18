import { DomainError } from "./errors";
import type { PersonCard } from "./types";

export function normalizePersonCard(input: { name?: string; clan?: string; origin?: string }): PersonCard {
  const name = (input.name ?? "").trim();
  if (!name) throw new DomainError("NAME_REQUIRED");
  const clan = (input.clan ?? "").trim() || null;
  const origin = (input.origin ?? "").trim() || null;
  return { name, clan, origin };
}
