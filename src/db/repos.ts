import { and, eq } from "drizzle-orm";
import { DomainError } from "../domain/errors";
import type { FamilyDocument, FamilyId, FamilyKey, Relation, UserId } from "../domain/types";
import type { Db } from "./client";
import {
  families,
  familyKeys,
  familyMembers,
  persons,
  relations,
  users,
} from "./schema";

export function createRepos(db: Db) {
  return {
    createUser: (email: string, passwordHash: string) => createUser(db, email, passwordHash),
    findUserByEmail: (email: string) => findUserByEmail(db, email),
    saveFamily: (doc: FamilyDocument) => saveFamily(db, doc),
    loadFamily: (id: FamilyId) => loadFamily(db, id),
    listFamiliesForUser: (userId: UserId) => listFamiliesForUser(db, userId),
    saveKey: (key: FamilyKey) => saveKey(db, key),
    loadKey: (token: string) => loadKey(db, token),
    listViewKeys: (familyId: FamilyId) => listViewKeys(db, familyId),
  };
}

function createUser(db: Db, email: string, passwordHash: string): UserId {
  const normalizedEmail = email.toLowerCase();
  const id = crypto.randomUUID();
  try {
    db.insert(users)
      .values({
        id,
        email: normalizedEmail,
        passwordHash,
        createdAt: Date.now(),
      })
      .run();
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new DomainError("EMAIL_TAKEN");
    }
    throw error;
  }
  return id;
}

function findUserByEmail(db: Db, email: string) {
  const row = db
    .select({ id: users.id, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .get();
  return row ?? null;
}

function saveFamily(db: Db, doc: FamilyDocument): void {
  db.transaction((tx) => {
    const existing = tx.select({ id: families.id }).from(families).where(eq(families.id, doc.id)).get();

    if (existing) {
      tx.delete(familyMembers).where(eq(familyMembers.familyId, doc.id)).run();
      tx.delete(relations).where(eq(relations.familyId, doc.id)).run();
      tx.delete(persons).where(eq(persons.familyId, doc.id)).run();
      tx.update(families)
        .set({
          rootPersonId: doc.rootPersonId,
          ownerUserId: doc.ownerUserId,
        })
        .where(eq(families.id, doc.id))
        .run();
    } else {
      tx.insert(families)
        .values({
          id: doc.id,
          rootPersonId: doc.rootPersonId,
          ownerUserId: doc.ownerUserId,
          createdAt: Date.now(),
        })
        .run();
    }

    for (const member of doc.members) {
      tx.insert(familyMembers)
        .values({
          familyId: doc.id,
          userId: member.userId,
          role: member.role,
        })
        .run();
    }

    for (const person of doc.graph.persons) {
      tx.insert(persons)
        .values({
          id: person.id,
          familyId: doc.id,
          name: person.name,
          clan: person.clan,
          origin: person.origin,
          claimedUserId: person.claimedUserId,
        })
        .run();
    }

    for (const relation of doc.graph.relations) {
      tx.insert(relations)
        .values(relationRow(doc.id, relation))
        .run();
    }
  });
}

function loadFamily(db: Db, id: FamilyId): FamilyDocument | null {
  const family = db.select().from(families).where(eq(families.id, id)).get();
  if (!family) {
    return null;
  }

  const memberRows = db.select().from(familyMembers).where(eq(familyMembers.familyId, id)).all();
  const personRows = db.select().from(persons).where(eq(persons.familyId, id)).all();
  const relationRows = db.select().from(relations).where(eq(relations.familyId, id)).all();

  return {
    id: family.id,
    rootPersonId: family.rootPersonId,
    ownerUserId: family.ownerUserId,
    members: memberRows.map((row) => ({
      userId: row.userId,
      role: row.role as "helper" | "owner",
    })),
    graph: {
      persons: personRows.map((row) => ({
        id: row.id,
        name: row.name,
        clan: row.clan,
        origin: row.origin,
        claimedUserId: row.claimedUserId,
      })),
      relations: relationRows.map(relationFromRow),
    },
  };
}

function listFamiliesForUser(db: Db, userId: UserId) {
  const rows = db
    .select({
      id: families.id,
      rootName: persons.name,
    })
    .from(familyMembers)
    .innerJoin(families, eq(familyMembers.familyId, families.id))
    .innerJoin(persons, and(eq(persons.id, families.rootPersonId), eq(persons.familyId, families.id)))
    .where(eq(familyMembers.userId, userId))
    .all();

  return rows.map((row) => ({ id: row.id, rootName: row.rootName }));
}

function saveKey(db: Db, key: FamilyKey): void {
  db.insert(familyKeys)
    .values({
      token: key.token,
      type: key.type,
      familyId: key.familyId,
      personId: key.personId,
      expiresAt: key.expiresAt,
      usedAt: key.usedAt,
      revokedAt: key.revokedAt,
    })
    .onConflictDoUpdate({
      target: familyKeys.token,
      set: {
        type: key.type,
        familyId: key.familyId,
        personId: key.personId,
        expiresAt: key.expiresAt,
        usedAt: key.usedAt,
        revokedAt: key.revokedAt,
      },
    })
    .run();
}

function loadKey(db: Db, token: string): FamilyKey | null {
  const row = db.select().from(familyKeys).where(eq(familyKeys.token, token)).get();
  if (!row) {
    return null;
  }
  return keyFromRow(row);
}

function listViewKeys(db: Db, familyId: FamilyId): FamilyKey[] {
  const rows = db
    .select()
    .from(familyKeys)
    .where(and(eq(familyKeys.familyId, familyId), eq(familyKeys.type, "view")))
    .all();
  return rows.map(keyFromRow);
}

function keyFromRow(row: typeof familyKeys.$inferSelect): FamilyKey {
  return {
    token: row.token,
    type: row.type as FamilyKey["type"],
    familyId: row.familyId,
    personId: row.personId,
    expiresAt: row.expiresAt,
    usedAt: row.usedAt,
    revokedAt: row.revokedAt,
  };
}

function relationRow(familyId: FamilyId, relation: Relation) {
  if (relation.type === "parent") {
    return {
      id: relation.id,
      familyId,
      type: relation.type,
      parentId: relation.parentId,
      childId: relation.childId,
      role: relation.role,
      a: null,
      b: null,
    };
  }
  return {
    id: relation.id,
    familyId,
    type: relation.type,
    parentId: null,
    childId: null,
    role: null,
    a: relation.a,
    b: relation.b,
  };
}

function relationFromRow(row: typeof relations.$inferSelect): Relation {
  if (row.type === "parent") {
    return {
      id: row.id,
      type: "parent",
      parentId: row.parentId!,
      childId: row.childId!,
      role: row.role as "father" | "mother",
    };
  }
  return {
    id: row.id,
    type: "spouse",
    a: row.a!,
    b: row.b!,
  };
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === "SQLITE_CONSTRAINT_UNIQUE"
  );
}
