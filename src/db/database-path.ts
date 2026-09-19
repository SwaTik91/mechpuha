import { join } from "path";

export function resolveDatabasePath(
  env: NodeJS.ProcessEnv = process.env,
  cwd: string = process.cwd(),
): string {
  if (env.DATABASE_PATH) return env.DATABASE_PATH;
  if (env.VERCEL === "1") return join("/tmp", "mishpucha.sqlite");
  return join(cwd, "data", "app.sqlite");
}
