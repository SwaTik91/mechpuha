const DEV_FALLBACK = "dev-secret-change-in-production-min-32-chars";

export function resolveSessionSecret(
  env: NodeJS.ProcessEnv = process.env,
): string {
  if (env.SESSION_SECRET) return env.SESSION_SECRET;

  const duringNextBuild = env.NEXT_PHASE === "phase-production-build";
  const onVercel = env.VERCEL === "1";
  if (env.NODE_ENV === "production" && !duringNextBuild && !onVercel) {
    throw new Error("SESSION_SECRET is required in production");
  }

  if (onVercel && env.VERCEL_PROJECT_ID) {
    return `vercel:${env.VERCEL_PROJECT_ID}`;
  }

  return DEV_FALLBACK;
}
