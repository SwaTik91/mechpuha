export type PersonId = string;
export type FamilyId = string;
export type UserId = string;
export type PersonCardInput = { name?: string; surname?: string; birthPlace?: string };
export type PersonCard = { name: string; surname: string | null; birthPlace: string | null };
export type Person = PersonCard & { id: PersonId; claimedUserId: UserId | null };
export type ParentRelation = {
  id: string;
  type: "parent";
  parentId: PersonId;
  childId: PersonId;
  role: "father" | "mother" | "parent";
};
export type SpouseRelation = { id: string; type: "spouse"; a: PersonId; b: PersonId };
export type Relation = ParentRelation | SpouseRelation;
export type FamilyGraph = { persons: Person[]; relations: Relation[] };
export type FamilyDocument = {
  id: FamilyId;
  rootPersonId: PersonId;
  ownerUserId: UserId | null;
  graph: FamilyGraph;
  members: { userId: UserId; role: "helper" | "owner" }[];
};
export type RelativeKind = "father" | "mother" | "spouse" | "son" | "daughter";
export type FamilyKey = {
  token: string;
  type: "helper" | "view" | "claim";
  familyId: FamilyId;
  personId: PersonId | null;
  expiresAt: number;
  usedAt: number | null;
  revokedAt: number | null;
};
