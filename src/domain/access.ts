import type { FamilyDocument, UserId } from "./types";

function findMember(doc: FamilyDocument, userId: UserId) {
  return doc.members.find((m) => m.userId === userId);
}

function isHelperOrOwner(doc: FamilyDocument, userId: UserId): boolean {
  const member = findMember(doc, userId);
  return member?.role === "helper" || member?.role === "owner";
}

export function canEdit(doc: FamilyDocument, userId: UserId): boolean {
  return isHelperOrOwner(doc, userId);
}

export function canViewFull(doc: FamilyDocument, userId: UserId): boolean {
  return isHelperOrOwner(doc, userId);
}

export function canRevokeView(doc: FamilyDocument, userId: UserId): boolean {
  if (doc.ownerUserId === null) {
    return findMember(doc, userId)?.role === "helper";
  }
  return doc.ownerUserId === userId;
}

export function canDeleteFamily(doc: FamilyDocument, userId: UserId): boolean {
  if (doc.ownerUserId === null) {
    return false;
  }
  return doc.ownerUserId === userId;
}
