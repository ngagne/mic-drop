# Contributing

## Local setup

```bash
npm install
npm run build
npm run test
```

If you will run performance commands, install k6.

## Common commands

```bash
npm run dev:cli -- list
npm run dev:cli -- run
npm run dev:cli -- perf --environment qa --ci
npm run lint
npm run build
npm run test
```

## Adding a new journey

1. Create folder: `src/journeys/<journey>/`
2. Add subfolders: `functional/`, `performance/`, `fixtures/`, `helpers/`
3. Add `.test.ts` files under functional/performance.
4. Validate discovery:

```bash
npm run dev:cli -- list
```

## Environment config conventions

- Add/update `config/environments/<env>.yml`.
- Keep credentials as `${ENV_VAR}` placeholders.
- Valid environments: `local`, `dev`, `qa`, `stage`, `prod`.

## Reporting expectations

After each run, check `reports/latest/index.html` and `reports/latest/raw-results.json`.
Use report-only mode to regenerate from latest raw payload:

```bash
npm run dev:cli -- run --report-only
```

## Before opening a PR

Run:

```bash
npm run lint
npm run build
npm run test
```

Keep docs and command examples aligned with actual CLI options in `src/cli/parser.ts`.
