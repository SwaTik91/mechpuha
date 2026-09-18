import { randomBytes } from "crypto";
import { canEdit, canRevokeView } from "./access";
import { DomainError } from "./errors";
import type { FamilyDocument, FamilyKey, UserId } from "./types";

function createToken(): string {
  return randomBytes(24).toString("hex");
}

function assertCanIssue(doc: FamilyDocument, actorId: UserId): void {
  if (!canEdit(doc, actorId)) {
    throw new DomainError("FORBIDDEN");
  }
}

function assertCanIssueView(doc: FamilyDocument, actorId: UserId): void {
  if (!canRevokeView(doc, actorId)) {
    throw new DomainError("FORBIDDEN");
  }
}

function assertKeyLive(key: FamilyKey, doc: FamilyDocument, type: FamilyKey["type"], now: number): void {
  if (
    key.type !== type ||
    key.familyId !== doc.id ||
    key.usedAt !== null ||
    key.revokedAt !== null ||
    now >= key.expiresAt
  ) {
    throw new DomainError("KEY_INVALID");
  }
}

export function issueHelperKey(doc: FamilyDocument, actorId: UserId, now: number, ttlMs: number): FamilyKey {
  assertCanIssue(doc, actorId);
  return {
    token: createToken(),
    type: "helper",
    familyId: doc.id,
    personId: null,
    expiresAt: now + ttlMs,
    usedAt: null,
    revokedAt: null,
  };
}

export function issueViewKey(
  doc: FamilyDocument,
  actorId: UserId,
  now: number,
  existingViewKeys: FamilyKey[]
): { next: FamilyKey; revoked: FamilyKey[] } {
  assertCanIssueView(doc, actorId);
  const revoked = existingViewKeys
    .filter((key) => key.familyId === doc.id && key.type === "view" && key.revokedAt === null)
    .map((key) => {
      key.revokedAt = now;
      return key;
    });
  const next: FamilyKey = {
    token: createToken(),
    type: "view",
    familyId: doc.id,
    personId: null,
    expiresAt: Number.MAX_SAFE_INTEGER,
    usedAt: null,
    revokedAt: null,
  };
  return { next, revoked };
}

export function issueClaimKey(doc: FamilyDocument, actorId: UserId, now: number, ttlMs: number): FamilyKey {
  assertCanIssue(doc, actorId);
  if (doc.ownerUserId !== null) {
    throw new DomainError("ALREADY_OWNED");
  }
  return {
    token: createToken(),
    type: "claim",
    familyId: doc.id,
    personId: doc.rootPersonId,
    expiresAt: now + ttlMs,
    usedAt: null,
    revokedAt: null,
  };
}

export function acceptHelper(doc: FamilyDocument, key: FamilyKey, userId: UserId, now: number): FamilyDocument {
  assertKeyLive(key, doc, "helper", now);
  key.usedAt = now;
  const alreadyMember = doc.members.some((m) => m.userId === userId);
  if (alreadyMember) {
    return doc;
  }
  return {
    ...doc,
    members: [...doc.members, { userId, role: "helper" }],
  };
}

export function acceptClaim(
  doc: FamilyDocument,
  key: FamilyKey,
  userId: UserId,
  now: number,
  answer: "yes" | "no"
): { doc: FamilyDocument; key: FamilyKey } {
  assertKeyLive(key, doc, "claim", now);

  if (answer === "no") {
    key.usedAt = now;
    return { doc, key };
  }

  if (doc.ownerUserId !== null) {
    throw new DomainError("CARD_TAKEN");
  }

  key.usedAt = now;
  const members = doc.members.some((m) => m.userId === userId)
    ? doc.members.map((m) => (m.userId === userId ? { ...m, role: "owner" as const } : m))
    : [...doc.members, { userId, role: "owner" as const }];

  const nextDoc: FamilyDocument = {
    ...doc,
    ownerUserId: userId,
    members,
    graph: {
      ...doc.graph,
      persons: doc.graph.persons.map((p) =>
        p.id === doc.rootPersonId ? { ...p, claimedUserId: userId } : p
      ),
    },
  };
  return { doc: nextDoc, key };
}
