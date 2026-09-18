import { createHmac } from "crypto";
import type { UserId } from "../domain/types";

const SESSION_DURATION_MS = 14 * 24 * 60 * 60 * 1000;

function hmac(userId: string, exp: number, secret: string): string {
  return createHmac("sha256", secret).update(`${userId}.${exp}`).digest("hex");
}

export function signSession(userId: UserId, secret: string): string {
  const exp = Date.now() + SESSION_DURATION_MS;
  return `${userId}.${exp}.${hmac(userId, exp, secret)}`;
}

export function readSession(token: string, secret: string): UserId | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [userId, expStr, sig] = parts;
  if (!userId || !expStr || !sig) return null;

  const exp = Number(expStr);
  if (Number.isNaN(exp)) return null;
  if (sig !== hmac(userId, exp, secret)) return null;
  if (Date.now() > exp) return null;

  return userId;
}
