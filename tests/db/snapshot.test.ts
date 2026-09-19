import { mkdtempSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { afterEach, describe, expect, it } from "vitest";
import { createFamily } from "../../src/domain/family";
import { createDb } from "../../src/db/client";
import { createRepos } from "../../src/db/repos";
import { decodeStoreCookie, dumpStore, encodeStoreCookie, loadStore, storeIsEmpty } from "../../src/db/snapshot";

describe("store snapshot", () => {
  let db: ReturnType<typeof createDb>;
  let other: ReturnType<typeof createDb>;

  afterEach(() => {
    db?.close();
    other?.close();
  });

  it("round-trips users and families into an empty database", () => {
    db = createDb(join(mkdtempSync(join(tmpdir(), "snap-a-")), "a.sqlite"));
    const repos = createRepos(db);
    const userId = repos.createUser("child@example.com", "hash");
    const doc = createFamily(userId, { name: "Давид", surname: "Абрамов", birthPlace: "Москва" });
    repos.saveFamily(doc);

    const snapshot = dumpStore(db);
    expect(storeIsEmpty(db)).toBe(false);

    other = createDb(join(mkdtempSync(join(tmpdir(), "snap-b-")), "b.sqlite"));
    expect(storeIsEmpty(other)).toBe(true);
    loadStore(other, snapshot);

    const restored = createRepos(other);
    expect(restored.findUserByEmail("child@example.com")?.id).toBe(userId);
    expect(restored.loadFamily(doc.id)?.graph.persons[0]).toMatchObject({
      name: "Давид",
      surname: "Абрамов",
      birthPlace: "Москва",
    });
  });

  it("encodes and decodes a snapshot for cookies", () => {
    const snapshot = {
      users: [{ id: "u1", email: "a@b.c", passwordHash: "h", createdAt: 1 }],
      families: [],
      members: [],
      persons: [],
      relations: [],
      keys: [],
    };
    const chunks = encodeStoreCookie(snapshot);
    expect(chunks.length).toBeGreaterThan(0);
    expect(decodeStoreCookie(chunks)).toEqual(snapshot);
  });
});
