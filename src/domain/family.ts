import { normalizePersonCard } from "./person";
import type { FamilyDocument, UserId } from "./types";

export function createFamily(userId: UserId, elder: { name?: string; clan?: string; origin?: string }): FamilyDocument {
  const card = normalizePersonCard(elder);
  const rootId = crypto.randomUUID();
  return {
    id: crypto.randomUUID(),
    rootPersonId: rootId,
    ownerUserId: null,
    graph: {
      persons: [{ id: rootId, ...card, claimedUserId: null }],
      relations: [],
    },
    members: [{ userId, role: "helper" }],
  };
}
