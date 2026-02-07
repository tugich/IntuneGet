# Contributing to IntuneGet

## Development Setup

```bash
git clone https://github.com/ugurkocde/IntuneGet.git
cd IntuneGet
npm install
cp .env.example .env.local
npm run dev
```

## Before Opening a PR

1. Create a focused branch from `main`.
2. Keep changes scoped to one problem or feature.
3. Run:

```bash
npm run lint
npm run test
npm run build
```

4. Update docs when behavior, env vars, or setup steps change.

## Pull Request Guidelines

1. Use a clear title and explain why the change is needed.
2. Include screenshots for UI changes.
3. Mention migration or breaking-change impact explicitly.
4. Link related issues when applicable.

## Reporting Bugs or Security Issues

- Bugs/feature requests: open a GitHub issue.
- Security concerns: follow `SECURITY.md`.
