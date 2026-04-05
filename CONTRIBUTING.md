# Contributing Guide

## Branch Strategy

- `main`: production-ready code only.
- `develop`: integration branch for completed features.
- `staging`: pre-release validation branch.
- `feature/<short-name>`: feature work from `develop`.
- `fix/<short-name>`: non-critical bug fix from `develop`.
- `hotfix/<short-name>`: urgent production fix from `main`.

## Pull Request Rules

- Open PRs into `develop` for regular work.
- Open PRs into `main` only for release or hotfix merges.
- Keep PRs focused and small where possible.
- Require passing CI (`npm run lint`, `npm run build`) before merge.

## Commit Convention

- Use clear conventional prefixes:
  - `feat:`
  - `fix:`
  - `refactor:`
  - `docs:`
  - `chore:`

Example: `feat: add interview response card rendering`

## Release Flow

1. Merge tested changes from `develop` into `staging`.
2. Validate end-to-end behavior on `staging`.
3. Merge `staging` into `main`.
4. Deploy `main` to Vercel.
