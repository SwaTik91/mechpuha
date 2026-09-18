import { canEdit, canViewFull } from "../domain/access";
import { DomainError } from "../domain/errors";
import { createFamily } from "../domain/family";
import {
  acceptClaim,
  acceptHelper,
  issueClaimKey,
  issueHelperKey,
  issueViewKey,
} from "../domain/invites";
import { addRelative } from "../domain/relations";
import type {
  FamilyDocument,
  FamilyGraph,
  FamilyId,
  FamilyKey,
  PersonId,
  RelativeKind,
  UserId,
} from "../domain/types";
import type { createRepos } from "../db/repos";

type RepoDeps = Pick<
  ReturnType<typeof createRepos>,
  | "createUser"
  | "findUserByEmail"
  | "saveFamily"
  | "loadFamily"
  | "listFamiliesForUser"
  | "saveKey"
  | "loadKey"
  | "listViewKeys"
>;

export type ActionsDeps = RepoDeps & {
  hashPassword: (plain: string) => Promise<string>;
  verifyPassword: (plain: string, hash: string) => Promise<boolean>;
  signSession: (userId: UserId, secret: string) => string;
  sessionSecret: string;
  now?: () => number;
  ttlMs?: { helper?: number; claim?: number };
};

const DEFAULT_TTL_MS = 7 * 86_400_000;

function assertCredentials(email: string, password: string): void {
  if (!email.trim() || !password) {
    throw new DomainError("INVALID_CREDENTIALS");
  }
}

function nowMs(deps: ActionsDeps): number {
  return deps.now?.() ?? Date.now();
}

function helperTtl(deps: ActionsDeps): number {
  return deps.ttlMs?.helper ?? DEFAULT_TTL_MS;
}

function claimTtl(deps: ActionsDeps): number {
  return deps.ttlMs?.claim ?? DEFAULT_TTL_MS;
}

function assertKeyLive(key: FamilyKey, doc: FamilyDocument, type: FamilyKey["type"], now: number): void {
  if (
    key.type !== type ||
    key.familyId !== doc.id ||
    key.usedAt !== null ||
    key.revokedAt !== null ||
    now >= key.expiresAt
  ) {
    throw new DomainError("KEY_INVALID");
  }
}

export function makeActions(deps: ActionsDeps) {
  return {
    async register(email: string, password: string): Promise<UserId> {
      assertCredentials(email, password);
      const passwordHash = await deps.hashPassword(password);
      return deps.createUser(email, passwordHash);
    },

    async login(email: string, password: string): Promise<string> {
      assertCredentials(email, password);
      const user = deps.findUserByEmail(email);
      if (!user || !(await deps.verifyPassword(password, user.passwordHash))) {
        throw new DomainError("INVALID_CREDENTIALS");
      }
      return deps.signSession(user.id, deps.sessionSecret);
    },

    async createFamilyAction(userId: UserId, elder: { name?: string; clan?: string; origin?: string }) {
      const doc = createFamily(userId, elder);
      deps.saveFamily(doc);
      return doc.id;
    },

    async addRelativeAction(
      userId: UserId,
      familyId: FamilyId,
      fromId: PersonId,
      kind: RelativeKind,
      card: { name?: string; clan?: string; origin?: string }
    ): Promise<void> {
      const doc = deps.loadFamily(familyId);
      if (!doc) {
        throw new DomainError("FORBIDDEN");
      }
      if (!canEdit(doc, userId)) {
        throw new DomainError("FORBIDDEN");
      }
      const graph = addRelative(doc.graph, fromId, kind, card);
      deps.saveFamily({ ...doc, graph });
    },

    async issueHelperAction(userId: UserId, familyId: FamilyId): Promise<string> {
      const doc = deps.loadFamily(familyId);
      if (!doc) {
        throw new DomainError("FORBIDDEN");
      }
      const key = issueHelperKey(doc, userId, nowMs(deps), helperTtl(deps));
      deps.saveKey(key);
      return key.token;
    },

    async issueViewAction(userId: UserId, familyId: FamilyId): Promise<string> {
      const doc = deps.loadFamily(familyId);
      if (!doc) {
        throw new DomainError("FORBIDDEN");
      }
      const existingViewKeys = deps.listViewKeys(familyId);
      const { next, revoked } = issueViewKey(doc, userId, nowMs(deps), existingViewKeys);
      for (const oldKey of revoked) {
        deps.saveKey(oldKey);
      }
      deps.saveKey(next);
      return next.token;
    },

    async issueClaimAction(userId: UserId, familyId: FamilyId): Promise<string> {
      const doc = deps.loadFamily(familyId);
      if (!doc) {
        throw new DomainError("FORBIDDEN");
      }
      const key = issueClaimKey(doc, userId, nowMs(deps), claimTtl(deps));
      deps.saveKey(key);
      return key.token;
    },

    async acceptHelperAction(userId: UserId, token: string): Promise<void> {
      const key = deps.loadKey(token);
      if (!key) {
        throw new DomainError("KEY_INVALID");
      }
      const doc = deps.loadFamily(key.familyId);
      if (!doc) {
        throw new DomainError("KEY_INVALID");
      }
      const now = nowMs(deps);
      const next = acceptHelper(doc, key, userId, now);
      deps.saveFamily(next);
      deps.saveKey(key);
    },

    async respondClaimAction(userId: UserId, token: string, answer: "yes" | "no"): Promise<void> {
      const key = deps.loadKey(token);
      if (!key) {
        throw new DomainError("KEY_INVALID");
      }
      const doc = deps.loadFamily(key.familyId);
      if (!doc) {
        throw new DomainError("KEY_INVALID");
      }
      const { doc: nextDoc, key: nextKey } = acceptClaim(doc, key, userId, nowMs(deps), answer);
      deps.saveFamily(nextDoc);
      deps.saveKey(nextKey);
    },

    async loadFamilyForUser(userId: UserId, familyId: FamilyId): Promise<FamilyDocument> {
      const doc = deps.loadFamily(familyId);
      if (!doc || !canViewFull(doc, userId)) {
        throw new DomainError("FORBIDDEN");
      }
      return doc;
    },

    async loadPoster(token: string): Promise<{ rootPersonId: PersonId; graph: FamilyGraph }> {
      const key = deps.loadKey(token);
      if (!key) {
        throw new DomainError("KEY_INVALID");
      }
      const doc = deps.loadFamily(key.familyId);
      if (!doc) {
        throw new DomainError("KEY_INVALID");
      }
      assertKeyLive(key, doc, "view", nowMs(deps));
      return { rootPersonId: doc.rootPersonId, graph: doc.graph };
    },
  };
}
