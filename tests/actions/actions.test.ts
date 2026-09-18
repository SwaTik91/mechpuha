import { describe, expect, it } from "vitest";
import { makeActions } from "../../src/app/actions";
import { createFamily } from "../../src/domain/family";
import { issueViewKey } from "../../src/domain/invites";
import { DomainError } from "../../src/domain/errors";
import type { FamilyDocument, FamilyKey, UserId } from "../../src/domain/types";

const NOW = 1_000_000;
const DAY = 86_400_000;

type MockStore = {
  users: Map<string, { id: UserId; passwordHash: string }>;
  families: Map<string, FamilyDocument>;
  keys: Map<string, FamilyKey>;
};

function makeMockDeps(store: MockStore, overrides: Partial<ReturnType<typeof makeMockDeps>> = {}) {
  const deps = {
    createUser: (email: string, passwordHash: string) => {
      const normalized = email.toLowerCase();
      if (store.users.has(normalized)) {
        throw new DomainError("EMAIL_TAKEN");
      }
      const id = crypto.randomUUID();
      store.users.set(normalized, { id, passwordHash });
      return id;
    },
    findUserByEmail: (email: string) => store.users.get(email.toLowerCase()) ?? null,
    saveFamily: (doc: FamilyDocument) => {
      store.families.set(doc.id, structuredClone(doc));
    },
    loadFamily: (id: string) => {
      const doc = store.families.get(id);
      return doc ? structuredClone(doc) : null;
    },
    listFamiliesForUser: (userId: UserId) =>
      [...store.families.values()]
        .filter((doc) => doc.members.some((m) => m.userId === userId))
        .map((doc) => ({
          id: doc.id,
          rootName: doc.graph.persons.find((p) => p.id === doc.rootPersonId)!.name,
        })),
    saveKey: (key: FamilyKey) => {
      store.keys.set(key.token, structuredClone(key));
    },
    loadKey: (token: string) => {
      const key = store.keys.get(token);
      return key ? structuredClone(key) : null;
    },
    hashPassword: async (plain: string) => `hash:${plain}`,
    verifyPassword: async (plain: string, hash: string) => hash === `hash:${plain}`,
    signSession: (userId: UserId) => `session:${userId}`,
    now: () => NOW,
    ttlMs: { helper: DAY, claim: DAY },
    sessionSecret: "test-secret-at-least-32-chars-long!!",
    ...overrides,
  };
  return deps;
}

describe("server actions", () => {
  it("register rejects empty credentials, duplicate email, and returns userId", async () => {
    const store: MockStore = { users: new Map(), families: new Map(), keys: new Map() };
    const actions = makeActions(makeMockDeps(store));

    await expect(actions.register("", "password")).rejects.toMatchObject({ code: "INVALID_CREDENTIALS" });
    await expect(actions.register("a@example.com", "")).rejects.toMatchObject({ code: "INVALID_CREDENTIALS" });

    const userId = await actions.register("child@example.com", "password12");
    expect(userId).toBeTruthy();
    expect(store.users.get("child@example.com")?.id).toBe(userId);

    await expect(actions.register("child@example.com", "other")).rejects.toMatchObject({ code: "EMAIL_TAKEN" });
  });

  it("loadFamilyForUser returns FORBIDDEN for a stranger", async () => {
    const store: MockStore = { users: new Map(), families: new Map(), keys: new Map() };
    const deps = makeMockDeps(store);
    const actions = makeActions(deps);

    const ownerId = deps.createUser("owner@example.com", "hash:pw");
    const strangerId = deps.createUser("stranger@example.com", "hash:pw");
    const doc = createFamily(ownerId, { name: "Давид" });
    deps.saveFamily(doc);

    await expect(actions.loadFamilyForUser(strangerId, doc.id)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(actions.loadFamilyForUser(ownerId, doc.id)).resolves.toMatchObject({ id: doc.id });
  });

  it("loadPoster returns a snapshot without membership and rejects dead tokens", async () => {
    const store: MockStore = { users: new Map(), families: new Map(), keys: new Map() };
    const deps = makeMockDeps(store);
    const actions = makeActions(deps);

    const ownerId = deps.createUser("owner@example.com", "hash:pw");
    const doc = createFamily(ownerId, { name: "Давид", clan: "Абрамовы" });
    deps.saveFamily(doc);

    const { next: viewKey } = issueViewKey(doc, ownerId, NOW, []);
    deps.saveKey(viewKey);

    const snapshot = await actions.loadPoster(viewKey.token);
    expect(snapshot).toEqual({ rootPersonId: doc.rootPersonId, graph: doc.graph });
    expect(snapshot).not.toHaveProperty("members");

    await expect(actions.loadPoster("missing-token")).rejects.toMatchObject({ code: "KEY_INVALID" });

    deps.saveKey({ ...viewKey, revokedAt: NOW + 1 });
    await expect(actions.loadPoster(viewKey.token)).rejects.toMatchObject({ code: "KEY_INVALID" });
  });

  it("respondClaimAction rejects a view token", async () => {
    const store: MockStore = { users: new Map(), families: new Map(), keys: new Map() };
    const deps = makeMockDeps(store);
    const actions = makeActions(deps);

    const ownerId = deps.createUser("owner@example.com", "hash:pw");
    const guestId = deps.createUser("guest@example.com", "hash:pw");
    const doc = createFamily(ownerId, { name: "Давид" });
    deps.saveFamily(doc);

    const { next: viewKey } = issueViewKey(doc, ownerId, NOW, []);
    deps.saveKey(viewKey);

    await expect(actions.respondClaimAction(guestId, viewKey.token, "yes")).rejects.toMatchObject({
      code: "KEY_INVALID",
    });
  });
});
