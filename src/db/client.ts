import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { join } from "path";
import * as schema from "./schema";

export type Db = ReturnType<typeof createDb>;

export function createDb(path: string) {
  const sqlite = new Database(path);
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: join(process.cwd(), "drizzle") });
  return Object.assign(db, {
    close: () => sqlite.close(),
  });
}
