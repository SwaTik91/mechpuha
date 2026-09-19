import { mkdirSync } from "fs";
import { createRequire } from "node:module";
import { dirname } from "path";
import { hashPassword, verifyPassword } from "../auth/password";
import { resolveSessionSecret } from "../auth/session-secret";
import { signSession } from "../auth/session";
import { resolveDatabasePath } from "../db/database-path";
import { createRepos } from "../db/repos";
import {
  dumpStore,
  loadStore,
  resetStore,
  storeIsEmpty,
  type StoreSnapshot,
} from "../db/snapshot";
import { makeActions } from "./actions";
import { readStoreCookie, writeStoreCookie } from "./store-cookie";

export const SESSION_SECRET = resolveSessionSecret();

type Repos = ReturnType<typeof createRepos>;
type Actions = ReturnType<typeof makeActions>;
type Runtime = {
  db: ReturnType<typeof import("../db/client").createDb>;
  repos: Repos;
  actions: Actions;
};

const globalForRuntime = globalThis as typeof globalThis & {
  mishpuchaRuntime?: Runtime;
};

function getRuntime() {
  if (!globalForRuntime.mishpuchaRuntime) {
    // Keep the native addon off Next's "collect page data" graph. Pages import
    // this module for SESSION_SECRET; opening SQLite here breaks Vercel builds.
    const require = createRequire(__filename);
    const { createDb } = require("../db/client") as typeof import("../db/client");
    const dbPath = resolveDatabasePath();
    mkdirSync(dirname(dbPath), { recursive: true });
    const db = createDb(dbPath);
    const repos = createRepos(db);
    globalForRuntime.mishpuchaRuntime = {
      db,
      repos,
      actions: makeActions({
        ...repos,
        hashPassword,
        verifyPassword,
        signSession,
        sessionSecret: SESSION_SECRET,
      }),
    };
  }
  return globalForRuntime.mishpuchaRuntime;
}

function applySnapshot(snapshot: StoreSnapshot | null) {
  if (!snapshot) return;
  const { db } = getRuntime();
  if (process.env.VERCEL === "1") {
    resetStore(db);
    loadStore(db, snapshot);
    return;
  }
  if (storeIsEmpty(db)) {
    loadStore(db, snapshot);
  }
}

export async function hydrateStore() {
  applySnapshot(await readStoreCookie());
}

export async function persistStore() {
  await writeStoreCookie(dumpStore(getRuntime().db));
}

function lazy<T extends object>(pick: (runtime: Runtime) => T): T {
  return new Proxy({} as T, {
    get(_target, prop, receiver) {
      const value = Reflect.get(pick(getRuntime()), prop, receiver);
      return typeof value === "function" ? value.bind(pick(getRuntime())) : value;
    },
  });
}

export const repos: Repos = lazy((runtime) => runtime.repos);
export const actions: Actions = lazy((runtime) => runtime.actions);
