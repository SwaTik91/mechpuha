# MishpuchaTech v1 — Final Fix Report

Branch: `cursor/mishpucha-closed-house-tree-ad19`

## Fixes applied

1. **Spouses in layout** — `layoutGenerations` expands each generation level with `expandWithSpouses`; `rootLevel` returned for root row; generation-tree and poster-tree render spouses beside partner; spouse vacancy in tree.
2. **Register invite flow** — `next` query/hidden field on `/register`, preserved on login/register links, `registerAction` redirects with same safe-path rule as login.
3. **Session secret** — `deps.ts` throws if `NODE_ENV=production` and `SESSION_SECRET` unset; cookie `maxAge` 14 days, `secure` in production.
4. **son/daughter parent role** — new child edges use `role: "parent"`; `hasFather`/`hasMother` only check explicit roles; DB/repos types updated.
5. **Role chooser** — AddSheet disables Отец/Мать/Супруг(а) when slot filled.
6. **Edit card** — `updatePersonCard` domain + `updatePersonCardAction` + «Править» in sheet; domain test added.
7. **Stranger access** — `/family/[id]` shows «Нет доступа» on `FORBIDDEN`; other errors still propagate.
8. **TS2502** — `makeMockDeps` typed as `ActionsDeps`.

## Commands & output

### TypeScript

```
$ npx tsc --noEmit
(exit 0, no errors)
```

### Vitest

```
$ npx vitest run

 RUN  v5.0.1 /workspace

 Test Files  11 passed (11)
      Tests  34 passed (34)
   Duration  625ms
```

### Playwright

```
$ npx playwright test

  ✓  open register, build two generations, open poster without login
  ✓  stranger cannot open another user family

  2 passed (15.4s)
```

Note: `playwright.config.ts` updated to pass `SESSION_SECRET` during `npm run build` (required after production startup guard).
