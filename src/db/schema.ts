import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: integer("created_at").notNull(),
});

export const families = sqliteTable("families", {
  id: text("id").primaryKey(),
  rootPersonId: text("root_person_id").notNull(),
  ownerUserId: text("owner_user_id"),
  createdAt: integer("created_at").notNull(),
});

export const familyMembers = sqliteTable("family_members", {
  familyId: text("family_id")
    .notNull()
    .references(() => families.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  role: text("role").notNull(),
});

export const persons = sqliteTable("persons", {
  id: text("id").primaryKey(),
  familyId: text("family_id")
    .notNull()
    .references(() => families.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  surname: text("surname"),
  birthPlace: text("birth_place"),
  claimedUserId: text("claimed_user_id"),
});

export const relations = sqliteTable("relations", {
  id: text("id").primaryKey(),
  familyId: text("family_id")
    .notNull()
    .references(() => families.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  parentId: text("parent_id"),
  childId: text("child_id"),
  role: text("role"),
  a: text("a"),
  b: text("b"),
});

export const familyKeys = sqliteTable("family_keys", {
  token: text("token").primaryKey(),
  type: text("type").notNull(),
  familyId: text("family_id").notNull(),
  personId: text("person_id"),
  expiresAt: integer("expires_at").notNull(),
  usedAt: integer("used_at"),
  revokedAt: integer("revoked_at"),
});
