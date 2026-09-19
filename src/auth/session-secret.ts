const DEV_FALLBACK = "dev-secret-change-in-production-min-32-chars";

export function resolveSessionSecret(
  env: NodeJS.ProcessEnv = process.env,
): string {
  if (
    env.NODE_ENV === "production" &&
    !env.SESSION_SECRET &&
    env.NEXT_PHASE !== "phase-production-build"
  ) {
    throw new Error("SESSION_SECRET is required in production");
  }
  return env.SESSION_SECRET ?? DEV_FALLBACK;
}
