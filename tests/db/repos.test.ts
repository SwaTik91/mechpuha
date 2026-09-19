import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createDb } from "../../src/db/client";
import { createRepos } from "../../src/db/repos";
import { createFamily } from "../../src/domain/family";
import { DomainError } from "../../src/domain/errors";
import type { FamilyKey } from "../../src/domain/types";

describe("repos", () => {
  let tempDir: string;
  let dbPath: string;
  let db: ReturnType<typeof createDb>;
  let repos: ReturnType<typeof createRepos>;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "mishpucha-db-"));
    dbPath = join(tempDir, "test.sqlite");
    db = createDb(dbPath);
    repos = createRepos(db);
  });

  afterEach(() => {
    db.close();
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("stores emails lowercased and rejects duplicates with EMAIL_TAKEN", () => {
    const id1 = repos.createUser("User@Example.com", "hash-1");
    expect(repos.findUserByEmail("user@example.com")).toEqual({ id: id1, passwordHash: "hash-1" });
    expect(repos.findUserByEmail("USER@EXAMPLE.COM")).toEqual({ id: id1, passwordHash: "hash-1" });

    try {
      repos.createUser("user@example.com", "hash-2");
      throw new Error("expected EMAIL_TAKEN");
    } catch (error) {
      expect(error).toBeInstanceOf(DomainError);
      expect((error as DomainError).code).toBe("EMAIL_TAKEN");
    }
  });

  it("registers two users independently", () => {
    const id1 = repos.createUser("one@example.com", "hash-1");
    const id2 = repos.createUser("two@example.com", "hash-2");
    expect(id1).not.toBe(id2);
    expect(repos.findUserByEmail("one@example.com")?.id).toBe(id1);
    expect(repos.findUserByEmail("two@example.com")?.id).toBe(id2);
  });

  it("saves and loads a family document", () => {
    const userId = repos.createUser("owner@example.com", "hash");
    const doc = createFamily(userId, { name: "Давид", clan: "Абрамовы", origin: "Москва" });
    repos.saveFamily(doc);
    expect(repos.loadFamily(doc.id)).toEqual(doc);
  });

  it("lists families for a member and returns empty for a stranger", () => {
    const userId = repos.createUser("member@example.com", "hash");
    const strangerId = repos.createUser("stranger@example.com", "hash-2");
    const doc = createFamily(userId, { name: "Давид" });
    repos.saveFamily(doc);

    expect(repos.listFamiliesForUser(userId)).toEqual([{ id: doc.id, rootName: "Давид" }]);
    expect(repos.listFamiliesForUser(strangerId)).toEqual([]);
  });

  it("lists view keys for a family", () => {
    const userId = repos.createUser("owner@example.com", "hash");
    const doc = createFamily(userId, { name: "Давид" });
    repos.saveFamily(doc);

    const viewKey: FamilyKey = {
      token: "token-view-1",
      type: "view",
      familyId: doc.id,
      personId: null,
      expiresAt: Date.now() + 60_000,
      usedAt: null,
      revokedAt: null,
    };
    const helperKey: FamilyKey = {
      token: "token-helper-1",
      type: "helper",
      familyId: doc.id,
      personId: null,
      expiresAt: Date.now() + 60_000,
      usedAt: null,
      revokedAt: null,
    };
    const otherFamilyViewKey: FamilyKey = {
      token: "token-view-other",
      type: "view",
      familyId: "other-family",
      personId: null,
      expiresAt: Date.now() + 60_000,
      usedAt: null,
      revokedAt: null,
    };
    repos.saveKey(viewKey);
    repos.saveKey(helperKey);
    repos.saveKey(otherFamilyViewKey);

    expect(repos.listViewKeys(doc.id)).toEqual([viewKey]);
    expect(repos.listViewKeys("missing-family")).toEqual([]);
  });

  it("saves and loads family keys", () => {
    const userId = repos.createUser("owner@example.com", "hash");
    const doc = createFamily(userId, { name: "Давид" });
    repos.saveFamily(doc);

    const key: FamilyKey = {
      token: "token-view-1",
      type: "view",
      familyId: doc.id,
      personId: null,
      expiresAt: Date.now() + 60_000,
      usedAt: null,
      revokedAt: null,
    };
    repos.saveKey(key);
    expect(repos.loadKey("token-view-1")).toEqual(key);
    expect(repos.loadKey("missing")).toBeNull();
  });
});
