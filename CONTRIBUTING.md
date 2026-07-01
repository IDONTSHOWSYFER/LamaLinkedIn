# Contributing to Lama Linked.In

This document describes the development workflow of the project. It is a pnpm
monorepo with three applications: `apps/api`, `apps/web`, `apps/extension`.

## Branching model

- `main` is the stable branch; it is always deployable.
- Every change is made on a dedicated **feature branch** named `feat/…`,
  `fix/…`, `chore/…` or `docs/…`.
- Changes reach `main` through a **pull request**, never by pushing to it
  directly.

## Pull request workflow

1. Create a feature branch from `main`.
2. Commit small, focused changes with clear messages (Conventional Commits:
   `feat:`, `fix:`, `chore:`, `docs:`, `test:`).
3. Open a pull request against `main`.
4. The CI pipeline (`.github/workflows/ci.yml`) runs automatically:
   **lint → test → build**. A pull request can only be merged once it is green.
5. Self-review the diff (or request a review), then merge.

## Quality gates

- **Lint** — ESLint (`eslint.config.mjs`) runs on the three applications:
  `pnpm -r lint`.
- **Types** — strict TypeScript: `pnpm -r typecheck`.
- **Tests** — Vitest (unit) + Supertest (API integration): `pnpm -r test`.
- **Dependencies** — Dependabot (`.github/dependabot.yml`) opens weekly update
  pull requests for each package and for GitHub Actions.

## Local setup

```bash
pnpm install
pnpm --filter @lbp/api db:generate   # generate the Prisma client
pnpm dev:api                          # run the API
pnpm dev:extension                    # run the extension in dev
```

## Definition of Done

- [ ] The feature branch is up to date with `main`.
- [ ] `pnpm -r lint`, `pnpm -r typecheck` and `pnpm -r test` pass locally.
- [ ] The CI pipeline is green on the pull request.
- [ ] The change is documented (README / code comments) where relevant.
