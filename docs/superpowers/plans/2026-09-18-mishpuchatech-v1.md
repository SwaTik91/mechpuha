# MishpuchaTech v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** С нуля собрать сайт: открытая регистрация, одно семейное древо на имя старшего, дерево поколений, лист добавления снизу, секретный плакат и отдельный забор владения.

**Architecture:** Вся предметная логика живёт в чистом TypeScript (`src/domain`) без Next.js и без SQL — так её тестируют Vitest. Репозиторий SQLite (`src/db`) хранит аккаунты, документы, связи и ключи. Тонкие server actions в `src/app` проверяют сессию, вызывают домен, отдают страницы. UI — мобильный сайт «семейная книга»: одно дерево поколений и нижний лист.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript, Drizzle ORM, better-sqlite3, Vitest, Playwright (сквозной сценарий в конце), `bcryptjs` для паролей.

## Global Constraints

- Интерфейс первой версии на русском.
- Сайт, удобный на телефоне. Отдельного нативного приложения нет.
- Фон `#F7F1E6`, чернила `#1F1A14`, второстепенный текст `#6B6256`, линии `#CFC3AD`.
- Имена — антиква (Georgia). Подписи — системный гротеск, мелкий, широкий трекинг.
- Акцент — линия и рамка, не заливка. Терракота и золото не использовать.
- Регистрация и вход открыты: почта и пароль, без инвайта на аккаунт.
- Роли «хранитель общины» нет.
- Нижней панели вкладок нет. Вторичные действия — тихий текст на странице.
- Карточка: имя обязательно; род и происхождение необязательны; дат, фото, «умер» нет.
- У человека не больше одного отца, одной матери, одного супруга.
- Братья и сёстры не добавляются отдельной кнопкой.
- Цикл в предках запрещён.
- Помощник не удаляет людей, связи и документ и не меняет корень.
- Ссылка на плакат не даёт писать и не даёт забрать карточку.
- Обычная регистрация не делает владельцем чужого корня.
- Данные одного документа не отдаются другому. Склейки нет.
- Спека: `docs/superpowers/specs/2026-09-18-mishpuchatech-closed-house-tree-design.md`.

## File map

| Path | Responsibility |
| --- | --- |
| `package.json` | Скрипты `dev`, `test`, `test:e2e`, `db:migrate` |
| `vitest.config.ts` | Юнит-тесты `tests/domain/**`, `tests/db/**` |
| `src/domain/errors.ts` | Коды ошибок, которые видит UI |
| `src/domain/person.ts` | Нормализация карточки, имя обязательно |
| `src/domain/relations.ts` | Добавить отца/мать/супруга/сына/дочь, инварианты |
| `src/domain/family.ts` | Создать документ, корень, роли, список семей пользователя |
| `src/domain/access.ts` | Кто читает/пишет документ; гость плаката только читает снимок |
| `src/domain/invites.ts` | Ключи helper / view / claim: выдать, принять, отозвать |
| `src/domain/types.ts` | Общие типы идентификаторов и документа |
| `src/auth/password.ts` | Хэш и проверка пароля |
| `src/auth/session.ts` | Подпись cookie-сессии |
| `src/db/schema.ts` | Таблицы Drizzle |
| `src/db/client.ts` | Подключение SQLite |
| `src/db/repos.ts` | Загрузка/сохранение документа и ключей |
| `src/app/globals.css` | Бумага и чернила |
| `src/app/layout.tsx` | Оболочка |
| `src/app/page.tsx` | После входа: создать семью или открыть документ |
| `src/app/register/page.tsx` | Открытая регистрация |
| `src/app/login/page.tsx` | Вход |
| `src/app/family/[id]/page.tsx` | Дом помощника / владельца |
| `src/app/poster/[token]/page.tsx` | Плакат без сессии |
| `src/app/invite/[token]/page.tsx` | Принять helper или claim |
| `src/components/generation-tree.tsx` | Дерево поколений |
| `src/components/add-sheet.tsx` | Лист «Отец Давида» |
| `src/app/actions.ts` | Server actions: auth, семья, родственник, ключи |
| `tests/domain/*.test.ts` | Правила спеки |
| `tests/e2e/success-path.spec.ts` | Сквозной успех |
| `data/` | Файл SQLite, в `.gitignore` |

---

### Task 1: Каркас и карточка человека

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `src/domain/types.ts`
- Create: `src/domain/errors.ts`
- Create: `src/domain/person.ts`
- Create: `tests/domain/person.test.ts`
- Modify: `.gitignore` (добавить `data/`, `.next/`)

**Interfaces:**
- Consumes: nothing
- Produces: `normalizePersonCard(input: { name?: string; clan?: string; origin?: string }): PersonCard` throws `DomainError('NAME_REQUIRED')`; `PersonCard` с полями `name: string`, `clan: string | null`, `origin: string | null`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { DomainError } from "../../src/domain/errors";
import { normalizePersonCard } from "../../src/domain/person";

describe("normalizePersonCard", () => {
  it("requires a name", () => {
    expect(() => normalizePersonCard({ name: "   " })).toThrowError(DomainError);
    try {
      normalizePersonCard({ name: "" });
    } catch (e) {
      expect(e).toMatchObject({ code: "NAME_REQUIRED" });
    }
  });

  it("keeps clan and origin optional and trims", () => {
    expect(normalizePersonCard({ name: "  Давид  ", clan: " Абрамовы ", origin: "" })).toEqual({
      name: "Давид",
      clan: "Абрамовы",
      origin: null,
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/domain/person.test.ts`
Expected: FAIL — cannot find module or `normalizePersonCard` is not defined.

- [ ] **Step 3: Write minimal implementation**

`package.json` scripts: `"test": "vitest run"`, `"dev": "next dev"`. Dependencies: `next`, `react`, `react-dom`, `typescript`, `vitest`, `@types/react`, `@types/node`.

```ts
// src/domain/errors.ts
export class DomainError extends Error {
  constructor(public code: string, message?: string) {
    super(message ?? code);
    this.name = "DomainError";
  }
}

// src/domain/types.ts
export type PersonId = string;
export type FamilyId = string;
export type UserId = string;
export type PersonCard = { name: string; clan: string | null; origin: string | null };

// src/domain/person.ts
import { DomainError } from "./errors";
import type { PersonCard } from "./types";

export function normalizePersonCard(input: { name?: string; clan?: string; origin?: string }): PersonCard {
  const name = (input.name ?? "").trim();
  if (!name) throw new DomainError("NAME_REQUIRED");
  const clan = (input.clan ?? "").trim() || null;
  const origin = (input.origin ?? "").trim() || null;
  return { name, clan, origin };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/domain/person.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add package.json tsconfig.json vitest.config.ts src/domain/errors.ts src/domain/types.ts src/domain/person.ts tests/domain/person.test.ts .gitignore
git commit -m "feat: validate person card name, clan, and origin"
```

---

### Task 2: Правила родства

**Files:**
- Create: `src/domain/relations.ts`
- Create: `tests/domain/relations.test.ts`
- Modify: `src/domain/types.ts`

**Interfaces:**
- Consumes: `PersonCard`, `normalizePersonCard`, `PersonId`
- Produces: `FamilyGraph` `{ persons: Person[]; relations: Relation[] }`; `addRelative(graph, fromId, kind, card): FamilyGraph` where `kind` is `'father' | 'mother' | 'spouse' | 'son' | 'daughter'`; `Person` is `PersonCard & { id: PersonId; claimedUserId: UserId | null }`; `Relation` is `{ id: string; type: 'parent'; parentId: PersonId; childId: PersonId; role: 'father' | 'mother' } | { id: string; type: 'spouse'; a: PersonId; b: PersonId }`
- Error codes: `PERSON_NOT_FOUND`, `FATHER_EXISTS`, `MOTHER_EXISTS`, `SPOUSE_EXISTS`, `CYCLE`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { addRelative, emptyGraph, seedPerson } from "../../src/domain/relations";

function davidGraph() {
  const g = emptyGraph();
  return seedPerson(g, { id: "p-david", name: "Давид", clan: "Абрамовы", origin: "Москва", claimedUserId: null });
}

describe("addRelative", () => {
  it("adds a father and a mother, then rejects a second father", () => {
    let g = davidGraph();
    g = addRelative(g, "p-david", "father", { name: "Рахамим", origin: "Дербент" });
    g = addRelative(g, "p-david", "mother", { name: "Сара", origin: "Куба" });
    expect(g.persons.map((p) => p.name).sort()).toEqual(["Давид", "Рахамим", "Сара"]);
    expect(() => addRelative(g, "p-david", "father", { name: "Другой" })).toThrowError(/FATHER_EXISTS/);
  });

  it("rejects a second spouse", () => {
    let g = davidGraph();
    g = addRelative(g, "p-david", "spouse", { name: "Мирьям" });
    expect(() => addRelative(g, "p-david", "spouse", { name: "Другая" })).toThrowError(/SPOUSE_EXISTS/);
  });

  it("adds a son so the new person is the child", () => {
    let g = davidGraph();
    g = addRelative(g, "p-david", "son", { name: "Ноах" });
    const child = g.persons.find((p) => p.name === "Ноах");
    expect(g.relations).toContainEqual(
      expect.objectContaining({ type: "parent", parentId: "p-david", childId: child!.id })
    );
  });

  it("rejects making a child the ancestor of their parent", () => {
    let g = davidGraph();
    g = addRelative(g, "p-david", "father", { name: "Рахамим" });
    const father = g.persons.find((p) => p.name === "Рахамим")!;
    expect(() => addRelative(g, father.id, "father", { name: "Давид" })).not.toThrow();
    // cycle: add Давид as father of Рахамим when Давид is already his child
    g = davidGraph();
    g = addRelative(g, "p-david", "son", { name: "Ноах" });
    const noah = g.persons.find((p) => p.name === "Ноах")!;
    expect(() => addRelative(g, noah.id, "son", { name: "Давид-цикл" })).not.toThrow();
    expect(() => addRelative(g, noah.id, "father", { name: "Давид" })).toThrowError(/CYCLE/);
  });
});
```

Fix the cycle test in implementation: adding a new person named "Давид" as father of Ноах is not a cycle (new id). The real cycle test is: take existing person ids. Add helper `wouldCreateCycle` used when linking two existing people — v1 only creates new people, so cycle happens if we later allow linking. For v1, cycle = new parent/child edge that connects a descendant as ancestor.

Simplest v1 cycle: if we add father to Ноах, the new father is a new person — no cycle. Cycle only if `kind` attached an *existing* id. So implement cycle check on the directed parent→child graph after the new edge: if `from` is already a descendant of the new person... New person has no descendants, so **new-person adds cannot cycle**.

The spec still wants the guard. Implement `assertNoCycle(graph)` after any parent edge: walk children of the new child and fail if we meet the parent. For a brand-new parent of X, parent has no prior edges — no cycle. For `son` of X, new child has no children — no cycle.

Keep the function and a test that uses an internal `linkParent(graph, parentId, childId, role)` exported for tests:

```ts
it("rejects a parent edge that closes a cycle", () => {
  let g = davidGraph();
  g = addRelative(g, "p-david", "son", { name: "Ноах" });
  const noah = g.persons.find((p) => p.name === "Ноах")!;
  expect(() => linkParent(g, noah.id, "p-david", "father")).toThrowError(/CYCLE/);
});
```

Use this test, not the earlier flawed one.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/domain/relations.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```ts
// add to types.ts
export type Person = PersonCard & { id: PersonId; claimedUserId: UserId | null };
export type ParentRelation = {
  id: string;
  type: "parent";
  parentId: PersonId;
  childId: PersonId;
  role: "father" | "mother";
};
export type SpouseRelation = { id: string; type: "spouse"; a: PersonId; b: PersonId };
export type Relation = ParentRelation | SpouseRelation;
export type FamilyGraph = { persons: Person[]; relations: Relation[] };
export type RelativeKind = "father" | "mother" | "spouse" | "son" | "daughter";
```

`addRelative`:
- find `from` or throw `PERSON_NOT_FOUND`
- `normalizePersonCard(card)` then new person with `crypto.randomUUID()`
- `father`/`mother`: if parent of that role exists → `FATHER_EXISTS` / `MOTHER_EXISTS`; else `linkParent(new, from, role)`
- `spouse`: if any spouse of `from` → `SPOUSE_EXISTS`; else spouse edge
- `son`/`daughter`: `linkParent(from, new, role)` where role is `father` if `from` already has a female spouse? **Do not guess gender of `from`.** Use `role: 'father'` only when kind is about the *new* person as child — parent role on the edge is the role of `from` if known, else store `role: 'father'` as default for the parent slot. Spec does not require knowing the selected person's sex. Store parent edge `{ parentId: from, childId: new, role: 'father' }` for son/daughter (role here means the parent's slot relative to child — if unknown, use `'father'` only when we later display "отец"; better: `role` is optional for this direction). **Lock:** for son/daughter, `role` on the edge is not displayed as "отец Давида"; it only builds generation. Use `role: 'father'` as unused label OR add `role: 'parent'`. Keep union `'father' | 'mother'` and set `role` to `'father'` for son/daughter when `from` has no opposite-parent constraint. This does not block a later mother on the child.

`linkParent`: if child already has that role → exists error; if `isAncestor(child, parent)` → `CYCLE`; push relation.

`isAncestor(person, maybeAncestor)`: BFS over parent edges upward from `person`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/domain/relations.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/domain/types.ts src/domain/relations.ts tests/domain/relations.test.ts
git commit -m "feat: enforce parent, spouse, and cycle rules"
```

---

### Task 3: Семейный документ и роли

**Files:**
- Create: `src/domain/family.ts`
- Create: `tests/domain/family.test.ts`

**Interfaces:**
- Consumes: `normalizePersonCard`, `FamilyGraph`, `Person`
- Produces: `FamilyDocument` `{ id: FamilyId; rootPersonId: PersonId; ownerUserId: UserId | null; graph: FamilyGraph; members: { userId: UserId; role: 'helper' | 'owner' }[] }`; `createFamily(userId, elderCard): FamilyDocument` — root = elder, creator is helper, `ownerUserId` is null; `userFamilyIds(docs, userId): FamilyId[]`; `cannotChangeRoot` — no function to change root exists

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { createFamily } from "../../src/domain/family";

describe("createFamily", () => {
  it("puts the elder at the root and the creator as helper without an owner", () => {
    const doc = createFamily("user-child", { name: "Давид", clan: "Абрамовы", origin: "Москва" });
    expect(doc.ownerUserId).toBeNull();
    expect(doc.members).toEqual([{ userId: "user-child", role: "helper" }]);
    const root = doc.graph.persons.find((p) => p.id === doc.rootPersonId);
    expect(root).toMatchObject({ name: "Давид", clan: "Абрамовы", origin: "Москва", claimedUserId: null });
  });

  it("rejects a nameless elder", () => {
    expect(() => createFamily("user-child", { name: "  " })).toThrowError(/NAME_REQUIRED/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/domain/family.test.ts`
Expected: FAIL

- [ ] **Step 3: Write minimal implementation**

```ts
export function createFamily(userId: UserId, elder: { name?: string; clan?: string; origin?: string }): FamilyDocument {
  const card = normalizePersonCard(elder);
  const rootId = crypto.randomUUID();
  return {
    id: crypto.randomUUID(),
    rootPersonId: rootId,
    ownerUserId: null,
    graph: {
      persons: [{ id: rootId, ...card, claimedUserId: null }],
      relations: [],
    },
    members: [{ userId, role: "helper" }],
  };
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run tests/domain/family.test.ts tests/domain/person.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/domain/family.ts src/domain/types.ts tests/domain/family.test.ts
git commit -m "feat: create family document with elder root and helper"
```

---

### Task 4: Доступ к документу

**Files:**
- Create: `src/domain/access.ts`
- Create: `tests/domain/access.test.ts`

**Interfaces:**
- Consumes: `FamilyDocument`, `UserId`
- Produces: `canEdit(doc, userId): boolean` — helper or owner; `canManageKeys(doc, userId): boolean` — same as canEdit before owner exists, after claim only owner for revoke/remove/delete (`canRevokeView` / `canRemoveHelper` / `canDeleteFamily`); `canViewFull(doc, userId): boolean` — helper or owner; guests are not in this function

Rules after claim (spec §10):
- helper still `canEdit` (add people, invite helpers)
- only owner: `canRevokeView`, `canRemoveHelper`, `canDeleteFamily`
- before claim: any helper has `canRevokeView` and can invite helpers and send claim; nobody `canDeleteFamily`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { createFamily } from "../../src/domain/family";
import { canDeleteFamily, canEdit, canRevokeView, canViewFull } from "../../src/domain/access";

describe("access", () => {
  it("hides the document from a stranger", () => {
    const doc = createFamily("child", { name: "Давид" });
    expect(canViewFull(doc, "stranger")).toBe(false);
    expect(canEdit(doc, "stranger")).toBe(false);
    expect(canViewFull(doc, "child")).toBe(true);
    expect(canEdit(doc, "child")).toBe(true);
    expect(canDeleteFamily(doc, "child")).toBe(false);
    expect(canRevokeView(doc, "child")).toBe(true);
  });

  it("after claim only the owner deletes", () => {
    const doc = {
      ...createFamily("child", { name: "Давид" }),
      ownerUserId: "elder",
      members: [
        { userId: "child", role: "helper" as const },
        { userId: "elder", role: "owner" as const },
      ],
    };
    expect(canEdit(doc, "child")).toBe(true);
    expect(canDeleteFamily(doc, "child")).toBe(false);
    expect(canDeleteFamily(doc, "elder")).toBe(true);
    expect(canRevokeView(doc, "child")).toBe(false);
    expect(canRevokeView(doc, "elder")).toBe(true);
  });
});
```

- [ ] **Step 2: Run to see FAIL**

Run: `npx vitest run tests/domain/access.test.ts`

- [ ] **Step 3: Implement `src/domain/access.ts`** matching the test.

- [ ] **Step 4: Run to see PASS**

- [ ] **Step 5: Commit**

```bash
git add src/domain/access.ts tests/domain/access.test.ts
git commit -m "feat: restrict family document access to members"
```

---

### Task 5: Три семейных ключа

**Files:**
- Create: `src/domain/invites.ts`
- Create: `tests/domain/invites.test.ts`
- Modify: `src/domain/types.ts`

**Interfaces:**
- Consumes: `FamilyDocument`, `canEdit`, `canRevokeView`, `DomainError`
- Produces:
  - `FamilyKey` `{ token: string; type: 'helper' | 'view' | 'claim'; familyId: FamilyId; personId: PersonId | null; expiresAt: number; usedAt: number | null; revokedAt: number | null }`
  - `issueHelperKey(doc, actorId, now, ttlMs): FamilyKey`
  - `issueViewKey(doc, actorId, now, existingViewKeys): { next: FamilyKey; revoked: FamilyKey[] }` — new view key, all previous view keys for that family get `revokedAt = now`
  - `issueClaimKey(doc, actorId, now, ttlMs): FamilyKey` — `personId = doc.rootPersonId`; throws `ALREADY_OWNED` if `ownerUserId`
  - `acceptHelper(doc, key, userId, now): FamilyDocument` — same family, user becomes helper if not already; key `usedAt = now`; throws `KEY_INVALID` if wrong type/expired/used/revoked
  - `acceptClaim(doc, key, userId, now, answer: 'yes' | 'no'): { doc: FamilyDocument; key: FamilyKey }` — `no` sets `usedAt` and leaves owner null; `yes` sets `ownerUserId`, member owner, `root.claimedUserId = userId`; second yes on owned card → `CARD_TAKEN`
  - view keys are never accepted into a role

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { createFamily } from "../../src/domain/family";
import {
  acceptClaim,
  acceptHelper,
  issueClaimKey,
  issueHelperKey,
  issueViewKey,
} from "../../src/domain/invites";

const NOW = 1_000_000;
const DAY = 86_400_000;

describe("family keys", () => {
  it("adds a helper to the same family id", () => {
    const doc = createFamily("child", { name: "Давид" });
    const key = issueHelperKey(doc, "child", NOW, DAY);
    const next = acceptHelper(doc, key, "cousin", NOW + 10);
    expect(next.id).toBe(doc.id);
    expect(next.members).toContainEqual({ userId: "cousin", role: "helper" });
  });

  it("revokes the previous view key when a new one is issued", () => {
    const doc = createFamily("child", { name: "Давид" });
    const first = issueViewKey(doc, "child", NOW, []);
    const second = issueViewKey(doc, "child", NOW + 1, [first.next]);
    expect(second.revoked[0].token).toBe(first.next.token);
    expect(second.revoked[0].revokedAt).toBe(NOW + 1);
    expect(second.next.revokedAt).toBeNull();
  });

  it("claim yes assigns one owner; claim no leaves owner empty; view token cannot claim", () => {
    const doc = createFamily("child", { name: "Давид" });
    const claim = issueClaimKey(doc, "child", NOW, DAY);
    const refused = acceptClaim(doc, claim, "other", NOW, "no");
    expect(refused.doc.ownerUserId).toBeNull();
    const claim2 = issueClaimKey(doc, "child", NOW, DAY);
    const taken = acceptClaim(doc, claim2, "elder", NOW, "yes");
    expect(taken.doc.ownerUserId).toBe("elder");
    expect(taken.doc.graph.persons.find((p) => p.id === doc.rootPersonId)?.claimedUserId).toBe("elder");
    const view = issueViewKey(doc, "child", NOW, []).next;
    expect(() => acceptClaim(doc, view as never, "x", NOW, "yes")).toThrowError(/KEY_INVALID/);
    expect(() => acceptClaim(taken.doc, issueClaimKey(taken.doc, "child", NOW, DAY), "x", NOW, "yes")).toThrowError(
      /ALREADY_OWNED|CARD_TAKEN/
    );
  });

  it("rejects an expired helper key", () => {
    const doc = createFamily("child", { name: "Давид" });
    const key = issueHelperKey(doc, "child", NOW, 10);
    expect(() => acceptHelper(doc, key, "late", NOW + 11)).toThrowError(/KEY_INVALID/);
  });
});
```

- [ ] **Step 2: Run FAIL**

Run: `npx vitest run tests/domain/invites.test.ts`

- [ ] **Step 3: Implement** tokens as `crypto.randomBytes(24).toString('hex')`. Default `ttlMs` for helper/claim: 7 days. View key `expiresAt` can be `Number.MAX_SAFE_INTEGER` until revoked (spec: until revoked).

- [ ] **Step 4: Run PASS** including previous domain tests: `npx vitest run tests/domain`

- [ ] **Step 5: Commit**

```bash
git add src/domain/invites.ts src/domain/types.ts tests/domain/invites.test.ts
git commit -m "feat: issue helper, view, and claim family keys"
```

---

### Task 6: Пароль и сессия

**Files:**
- Create: `src/auth/password.ts`
- Create: `src/auth/session.ts`
- Create: `tests/auth/password.test.ts`
- Create: `tests/auth/session.test.ts`

**Interfaces:**
- Consumes: nothing from domain
- Produces: `hashPassword(plain: string): Promise<string>`; `verifyPassword(plain, hash): Promise<boolean>`; `signSession(userId: UserId, secret: string): string`; `readSession(token: string, secret: string): UserId | null`

- [ ] **Step 1: Failing tests**

```ts
// tests/auth/password.test.ts
it("accepts the same password and rejects a wrong one", async () => {
  const hash = await hashPassword("секрет-1");
  expect(await verifyPassword("секрет-1", hash)).toBe(true);
  expect(await verifyPassword("нет", hash)).toBe(false);
});

// tests/auth/session.test.ts
it("round-trips a user id and rejects tampering", () => {
  const t = signSession("user-1", "test-secret-at-least-32-chars-long!!");
  expect(readSession(t, "test-secret-at-least-32-chars-long!!")).toBe("user-1");
  expect(readSession(t + "x", "test-secret-at-least-32-chars-long!!")).toBeNull();
});
```

- [ ] **Step 2: Run FAIL**

- [ ] **Step 3: Implement** `bcryptjs` cost 10. Session: HMAC-SHA256 over `userId.exp` with `crypto.createHmac`, format `userId.exp.sig`, exp = now+14d.

- [ ] **Step 4: PASS**

- [ ] **Step 5: Commit**

```bash
git add src/auth/password.ts src/auth/session.ts tests/auth package.json
git commit -m "feat: hash passwords and sign session cookies"
```

---

### Task 7: SQLite-хранилище

**Files:**
- Create: `src/db/schema.ts`
- Create: `src/db/client.ts`
- Create: `src/db/repos.ts`
- Create: `tests/db/repos.test.ts`
- Create: `drizzle.config.ts`
- Modify: `.gitignore` — `data/*.sqlite`

**Interfaces:**
- Consumes: `FamilyDocument`, `FamilyKey`, password hash
- Produces:
  - `createUser(email, passwordHash): UserId` — throws `EMAIL_TAKEN` on unique email (store lowercased)
  - `findUserByEmail(email): { id: UserId; passwordHash: string } | null`
  - `saveFamily(doc): void` / `loadFamily(id): FamilyDocument | null`
  - `listFamiliesForUser(userId): { id: FamilyId; rootName: string }[]`
  - `saveKey(key: FamilyKey): void` / `loadKey(token): FamilyKey | null`
  - Tables: `users(id, email unique, password_hash, created_at)`; `families(id, root_person_id, owner_user_id, created_at)`; `family_members(family_id, user_id, role)`; `persons(id, family_id, name, clan, origin, claimed_user_id)`; `relations(id, family_id, type, parent_id, child_id, role, a, b)`; `family_keys(token primary key, type, family_id, person_id, expires_at, used_at, revoked_at)`

- [ ] **Step 1: Failing test** using a temp file `data/test.sqlite`: register two emails, save `createFamily`, load back, list for user, stranger list empty.

- [ ] **Step 2: FAIL**

- [ ] **Step 3: Drizzle schema + `better-sqlite3`. `client.ts` takes a path. In tests use `os.tmpdir()`.

- [ ] **Step 4: PASS** `npx vitest run tests/db/repos.test.ts`

- [ ] **Step 5: Commit**

```bash
git add src/db drizzle.config.ts tests/db .gitignore package.json
git commit -m "feat: persist users, families, and keys in sqlite"
```

---

### Task 8: Server actions

**Files:**
- Create: `src/app/actions.ts`
- Create: `src/app/session-cookie.ts`
- Create: `tests/actions/actions.test.ts` — test the action functions by injecting repos (export `makeActions(deps)` to avoid Next runtime in Vitest)

**Interfaces:**
- Consumes: all domain + repos + password + session
- Produces: `makeActions(deps)` with:
  - `register(email, password)` — empty email/password → `INVALID_CREDENTIALS`; duplicate → `EMAIL_TAKEN`; returns userId
  - `login(email, password)` — unknown or wrong → same message code `INVALID_CREDENTIALS` (не уточнять что именно)
  - `createFamilyAction(userId, elder)`
  - `addRelativeAction(userId, familyId, fromId, kind, card)` — load, `canEdit` or `FORBIDDEN`, `addRelative`, save
  - `issueViewAction` / `issueHelperAction` / `issueClaimAction`
  - `acceptHelperAction(userId, token)` / `respondClaimAction(userId, token, 'yes'|'no')`
  - `loadFamilyForUser(userId, familyId)` → `FORBIDDEN` if `!canViewFull`
  - `loadPoster(token)` → snapshot `{ rootPersonId, graph }` if view key live; `KEY_INVALID` otherwise. **No write methods on this path.**

- [ ] **Step 1: Failing tests** for register, stranger `FORBIDDEN`, poster snapshot without membership, view token cannot `respondClaimAction`.

- [ ] **Step 2: FAIL**

- [ ] **Step 3: Implement `makeActions`. Cookie helpers live in `session-cookie.ts` and are not required for these unit tests.

- [ ] **Step 4: PASS**

- [ ] **Step 5: Commit**

```bash
git add src/app/actions.ts src/app/session-cookie.ts tests/actions
git commit -m "feat: add server actions for auth, family, and keys"
```

---

### Task 9: Оболочка «книга» и открытый вход

**Files:**
- Create: `src/app/globals.css`
- Create: `src/app/layout.tsx`
- Create: `src/app/register/page.tsx`
- Create: `src/app/login/page.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/create/page.tsx`
- Create: `next.config.ts`
- Modify: `package.json` — `dev`, `build`

**Interfaces:**
- Consumes: `register` / `login` / `listFamiliesForUser` / `createFamilyAction`
- Produces: pages in Russian; paper background; fields as underlines; no invite code on register

`globals.css`:

```css
:root {
  --paper: #f7f1e6;
  --ink: #1f1a14;
  --muted: #6b6256;
  --rule: #cfc3ad;
}
html, body { background: var(--paper); color: var(--ink); font-family: Georgia, "Iowan Old Style", serif; }
label { font-family: system-ui, sans-serif; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); }
input { background: transparent; border: 0; border-bottom: 1px solid var(--ink); width: 100%; padding: 8px 0; font: inherit; color: inherit; }
button.primary { background: transparent; border: 1px solid var(--ink); width: 100%; padding: 10px; font-family: system-ui, sans-serif; }
```

- [ ] **Step 1: No Vitest here.** Manual check after implement: `npm run dev`, open `/register`, create account, land on «Создать семью».

- [ ] **Step 2: Implement pages**
  - `/register`: почта, пароль, «Создать аккаунт», ссылка «Уже есть вход»
  - `/login`: почта, пароль, «Войти», ошибка «Неверная почта или пароль»
  - `/`: if no session → redirect login; if no families → redirect `/create`; if one family → redirect `/family/:id`; if several → list names
  - `/create`: имя / род / происхождение старшего, «Открыть книгу»

- [ ] **Step 3: Commit**

```bash
git add src/app next.config.ts package.json
git commit -m "feat: add paper shell, open register, and create family"
```

---

### Task 10: Дерево поколений и лист добавления

**Files:**
- Create: `src/components/generation-tree.tsx`
- Create: `src/components/add-sheet.tsx`
- Create: `src/app/family/[id]/page.tsx`
- Create: `src/domain/layout.ts`
- Create: `tests/domain/layout.test.ts`

**Interfaces:**
- Consumes: `FamilyGraph`, `rootPersonId`, `addRelativeAction`
- Produces: `layoutGenerations(graph, rootId): { levels: PersonId[][] }` — level 0 = root, level -1 parents, level +1 children (only one step up and down for v1 display; if grandparents added as parents of parents, include level -2)
- `GenerationTree` props: `graph`, `rootId`, `selectedId`, `onSelect(id)`, `onVacancy(personId, kind)`
- Vacancy: if person has no father, show dashed «отец»; same for mother; always show one dashed «ребёнок» (maps to `son` default — sheet asks сын/дочь)
- `AddSheet` open when vacancy or «добавить к {name}»: title `Отец Давида`, fields name/clan/origin, «Сохранить», tree visible and dimmed behind

- [ ] **Step 1: Failing layout test**

```ts
it("places parents above the root and children below", () => {
  let g = emptyGraph();
  g = seedPerson(g, { id: "d", name: "Давид", clan: null, origin: null, claimedUserId: null });
  g = addRelative(g, "d", "father", { name: "Рахамим" });
  g = addRelative(g, "d", "son", { name: "Ноах" });
  const { levels } = layoutGenerations(g, "d");
  expect(levels[-1].map(id => g.persons.find(p => p.id === id)!.name)).toContain("Рахамим");
  expect(levels[0]).toEqual(["d"]);
  expect(levels[1].map(id => g.persons.find(p => p.id === id)!.name)).toContain("Ноах");
});
```

Use a `Map` or `{ up: PersonId[][]; root: PersonId; down: PersonId[][] }` if negative keys are awkward:

```ts
export function layoutGenerations(graph: FamilyGraph, rootId: PersonId): {
  ancestors: PersonId[][]; // [parents, grandparents, ...]
  root: PersonId;
  descendants: PersonId[][]; // [children, grandchildren, ...]
}
```

- [ ] **Step 2: FAIL then implement `layoutGenerations`**

- [ ] **Step 3: Build the family page** — selected outline, dashed vacancies, bottom sheet, text actions «Позвать помощника», «Ссылка для старшего», «Пригласить забрать дом». After two generations exist, show extra line «Можно показать старшему».

- [ ] **Step 4: Commit**

```bash
git add src/domain/layout.ts tests/domain/layout.test.ts src/components src/app/family
git commit -m "feat: render generation tree and add-relative sheet"
```

---

### Task 11: Плакат и страницы ключей

**Files:**
- Create: `src/app/poster/[token]/page.tsx`
- Create: `src/app/invite/[token]/page.tsx`
- Create: `src/components/poster-tree.tsx` — same layout, no vacancies, no buttons

**Interfaces:**
- Consumes: `loadPoster`, `acceptHelperAction`, `respondClaimAction`
- Produces: poster at `/poster/:token` works **without cookie**; dead token shows «Ссылка больше не действует»; invite page requires session (redirect login with `?next=`); claim page shows card and «Это вы?» / «Нет»

- [ ] **Step 1: Implement poster** — title family = root clan or `Семья {root.name}`; root name centered with rules; no «это вы».

- [ ] **Step 2: Implement invite** — if key type helper: button «Войти в эту книгу»; if claim: yes/no; if view: redirect to `/poster/:token`.

- [ ] **Step 3: Wire issue actions** on family page to copy URL `/poster/{token}` or `/invite/{token}` into clipboard and show the URL as text.

- [ ] **Step 4: Commit**

```bash
git add src/app/poster src/app/invite src/components/poster-tree.tsx src/app/family
git commit -m "feat: add view-only poster and invite acceptance pages"
```

---

### Task 12: Сквозной успех

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/e2e/success-path.spec.ts`

**Interfaces:**
- Consumes: running `next dev` or `next start` against a fresh `data/e2e.sqlite`

- [ ] **Step 1: Write the e2e test**

```ts
test("open register, build two generations, open poster without login", async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("/register");
  await page.getByLabel("Почта").fill("child@example.com");
  await page.getByLabel("Пароль").fill("password12");
  await page.getByRole("button", { name: "Создать аккаунт" }).click();
  await page.getByLabel("Имя").fill("Давид");
  await page.getByLabel("Род").fill("Абрамовы");
  await page.getByLabel("Происхождение").fill("Москва");
  await page.getByRole("button", { name: "Открыть книгу" }).click();
  await page.getByText("+ отец", { exact: false }).click();
  await page.getByLabel("Имя").fill("Рахамим");
  await page.getByLabel("Происхождение").fill("Дербент");
  await page.getByRole("button", { name: "Сохранить" }).click();
  await page.getByText("+ мать", { exact: false }).click();
  await page.getByLabel("Имя").fill("Сара");
  await page.getByRole("button", { name: "Сохранить" }).click();
  await page.getByText("Ссылка для старшего").click();
  const url = await page.getByTestId("poster-url").innerText();
  const guest = await browser.newContext();
  const poster = await guest.newPage();
  await poster.goto(url);
  await expect(poster.getByText("Давид")).toBeVisible();
  await expect(poster.getByText("Рахамим")).toBeVisible();
  await expect(poster.getByText("Сара")).toBeVisible();
  await expect(poster.getByText("Сохранить")).toHaveCount(0);
});
```

- [ ] **Step 2: Run e2e**

Run: `npx playwright test tests/e2e/success-path.spec.ts`
Expected: PASS

Also add a second test: user B registered, opens `/family/{idOfA}` → not found or «Нет доступа», not the tree.

- [ ] **Step 3: Commit**

```bash
git add playwright.config.ts tests/e2e
git commit -m "test: cover the two-generation poster success path"
```

---

## Self-review

**Spec coverage**

| Спека | Задача |
| --- | --- |
| Открытая регистрация | 6, 8, 9 |
| Создать семью на имя старшего, создатель — помощник | 3, 8, 9 |
| Карточка имя/род/происхождение | 1, 10 |
| Отец/мать/супруг/сын/дочь + лимиты + цикл | 2, 10 |
| Дерево поколений, пунктир, лист снизу | 10 |
| Плакат без входа, отзыв ссылки | 5, 8, 11 |
| Помощник в то же древо | 5, 8, 11 |
| Забор «это я» / «нет» / карточка занята | 5, 8, 11 |
| Чужая семья не видит | 4, 8, 12 |
| Нет таббара, бумага/чернила | 9, 10 |
| Нет хранителя, склейки, дат, фото | не делается |
| Несколько семей у одного пользователя | 8, 9 (`/` list) |
| Помощник не удаляет документ | 4 |

**Placeholders:** none intended. Cycle test uses `linkParent`. Session secret from `process.env.SESSION_SECRET` with a dev default only in `next dev`.

**Types:** `PersonCard`, `FamilyGraph`, `FamilyDocument`, `FamilyKey`, `RelativeKind`, `canEdit` / `canViewFull` / `canRevokeView` / `canDeleteFamily` — used under those names in later tasks.
