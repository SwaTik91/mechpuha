import { mkdirSync } from "fs";
import { createRequire } from "node:module";
import { dirname } from "path";
import { hashPassword, verifyPassword } from "../auth/password";
import { resolveSessionSecret } from "../auth/session-secret";
import { signSession } from "../auth/session";
import { resolveDatabasePath } from "../db/database-path";
import { createRepos } from "../db/repos";
import { makeActions } from "./actions";

export const SESSION_SECRET = resolveSessionSecret();

type Repos = ReturnType<typeof createRepos>;
type Actions = ReturnType<typeof makeActions>;

const globalForRuntime = globalThis as typeof globalThis & {
  mishpuchaRuntime?: { repos: Repos; actions: Actions };
};

function getRuntime() {
  if (!globalForRuntime.mishpuchaRuntime) {
    // Keep the native addon off Next's "collect page data" graph. Pages import
    // this module for SESSION_SECRET; opening SQLite here breaks Vercel builds.
    const require = createRequire(__filename);
    const { createDb } = require("../db/client") as typeof import("../db/client");
    const dbPath = resolveDatabasePath();
    mkdirSync(dirname(dbPath), { recursive: true });
    const repos = createRepos(createDb(dbPath));
    globalForRuntime.mishpuchaRuntime = {
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

function lazy<T extends object>(pick: (runtime: { repos: Repos; actions: Actions }) => T): T {
  return new Proxy({} as T, {
    get(_target, prop, receiver) {
      const value = Reflect.get(pick(getRuntime()), prop, receiver);
      return typeof value === "function" ? value.bind(pick(getRuntime())) : value;
    },
  });
}

export const repos: Repos = lazy((runtime) => runtime.repos);
export const actions: Actions = lazy((runtime) => runtime.actions);
