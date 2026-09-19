import { cookies } from "next/headers";
import {
  decodeStoreCookie,
  encodeStoreCookie,
  type StoreSnapshot,
} from "../db/snapshot";

const PREFIX = "mishpucha_store_";
const MAX_CHUNKS = 8;
const MAX_AGE_SEC = 14 * 24 * 60 * 60;

export async function readStoreCookie(): Promise<StoreSnapshot | null> {
  try {
    const jar = await cookies();
    const chunks: string[] = [];
    for (let i = 0; i < MAX_CHUNKS; i++) {
      const value = jar.get(`${PREFIX}${i}`)?.value;
      if (!value) break;
      chunks.push(value);
    }
    return decodeStoreCookie(chunks);
  } catch {
    return null;
  }
}

export async function writeStoreCookie(snapshot: StoreSnapshot): Promise<void> {
  const jar = await cookies();
  const chunks = encodeStoreCookie(snapshot);
  for (let i = 0; i < MAX_CHUNKS; i++) {
    const name = `${PREFIX}${i}`;
    if (i < chunks.length && chunks[i]) {
      jar.set(name, chunks[i], {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: MAX_AGE_SEC,
        secure: process.env.NODE_ENV === "production",
      });
    } else if (jar.get(name)) {
      jar.delete(name);
    }
  }
}
