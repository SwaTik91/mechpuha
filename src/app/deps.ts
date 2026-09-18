import { mkdirSync } from "fs";
import { join } from "path";
import { hashPassword, verifyPassword } from "../auth/password";
import { signSession } from "../auth/session";
import { createDb } from "../db/client";
import { createRepos } from "../db/repos";
import { makeActions } from "./actions";

export const SESSION_SECRET =
  process.env.SESSION_SECRET ?? "dev-secret-change-in-production-min-32-chars";

const globalForDb = globalThis as typeof globalThis & {
  mishpuchaDb?: ReturnType<typeof createDb>;
};

function getDb() {
  if (!globalForDb.mishpuchaDb) {
    const dbPath =
      process.env.DATABASE_PATH ?? join(process.cwd(), "data", "app.sqlite");
    mkdirSync(join(dbPath, ".."), { recursive: true });
    globalForDb.mishpuchaDb = createDb(dbPath);
  }
  return globalForDb.mishpuchaDb;
}

const db = getDb();
export const repos = createRepos(db);

export const actions = makeActions({
  ...repos,
  hashPassword,
  verifyPassword,
  signSession,
  sessionSecret: SESSION_SECRET,
});
