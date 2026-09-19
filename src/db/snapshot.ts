import { deflateSync, inflateSync } from "zlib";
import type { Db } from "./client";
import {
  families,
  familyKeys,
  familyMembers,
  persons,
  relations,
  users,
} from "./schema";

export type StoreSnapshot = {
  users: (typeof users.$inferSelect)[];
  families: (typeof families.$inferSelect)[];
  members: (typeof familyMembers.$inferSelect)[];
  persons: (typeof persons.$inferSelect)[];
  relations: (typeof relations.$inferSelect)[];
  keys: (typeof familyKeys.$inferSelect)[];
};

const COOKIE_CHUNK = 3000;

export function storeIsEmpty(db: Db): boolean {
  return db.select().from(users).all().length === 0;
}

export function dumpStore(db: Db): StoreSnapshot {
  return {
    users: db.select().from(users).all(),
    families: db.select().from(families).all(),
    members: db.select().from(familyMembers).all(),
    persons: db.select().from(persons).all(),
    relations: db.select().from(relations).all(),
    keys: db.select().from(familyKeys).all(),
  };
}

export function resetStore(db: Db): void {
  db.transaction((tx) => {
    tx.delete(familyKeys).run();
    tx.delete(relations).run();
    tx.delete(persons).run();
    tx.delete(familyMembers).run();
    tx.delete(families).run();
    tx.delete(users).run();
  });
}

export function loadStore(db: Db, snapshot: StoreSnapshot): void {
  db.transaction((tx) => {
    for (const row of snapshot.users) tx.insert(users).values(row).run();
    for (const row of snapshot.families) tx.insert(families).values(row).run();
    for (const row of snapshot.members) tx.insert(familyMembers).values(row).run();
    for (const row of snapshot.persons) tx.insert(persons).values(row).run();
    for (const row of snapshot.relations) tx.insert(relations).values(row).run();
    for (const row of snapshot.keys) tx.insert(familyKeys).values(row).run();
  });
}

export function encodeStoreCookie(snapshot: StoreSnapshot): string[] {
  const packed = deflateSync(Buffer.from(JSON.stringify(snapshot), "utf8")).toString("base64url");
  const chunks: string[] = [];
  for (let i = 0; i < packed.length; i += COOKIE_CHUNK) {
    chunks.push(packed.slice(i, i + COOKIE_CHUNK));
  }
  return chunks.length > 0 ? chunks : [""];
}

export function decodeStoreCookie(chunks: string[]): StoreSnapshot | null {
  if (chunks.length === 0 || chunks.every((chunk) => !chunk)) return null;
  try {
    const json = inflateSync(Buffer.from(chunks.join(""), "base64url")).toString("utf8");
    return JSON.parse(json) as StoreSnapshot;
  } catch {
    return null;
  }
}
