# Migration guide: ReadyAPI to mic-check

This guide helps teams move API suites from ReadyAPI projects to this CLI-driven journey model.

## Concept mapping

| ReadyAPI concept | mic-check equivalent | Notes |
| --- | --- | --- |
| Project | Repository + journey folders | Keep one domain flow per journey (`src/journeys/<name>`). |
| TestSuite | Journey | Separate by business flow (auth, payments, claims, etc.). |
| TestCase | `.test.ts` spec | Functional and performance are separated by folder. |
| TestStep (REST Request) | Helper + request builder/assertions | Move protocol logic into `helpers/`; keep specs readable. |
| Environment | `config/environments/<env>.yml` + `--environment` | Supports `${ENV_VAR}` interpolation and schema validation. |
| Property Expansion | `${ENV_VAR}` in YAML | Fail-fast when referenced env vars are missing. |
| Tags / custom properties | `@tag` in test names + `--tags` | Tag filtering applies to functional test names. |
| LoadTest | Performance test file + `perf`/`--performance` | Executed via `k6 run` per discovered performance file. |
| Reports tab | `reports/latest/index.html` + `raw-results.json` + `allure-results/` | Historical runs stored in `reports/history/run-*`. |

## Phased migration approach

### Phase 1: Inventory and classify

- Export ReadyAPI suites/cases.
- Group by business journey.
- Mark each case as functional vs performance.
- Identify reusable auth/request steps for helper extraction.

### Phase 2: Scaffold journeys

- Create `src/journeys/<journey>/{functional,performance,fixtures,helpers}`.
- Port data sets into fixtures.
- Port shared setup into helpers.

### Phase 3: Port functional coverage first

- Recreate high-value ReadyAPI test cases in Vitest.
- Add `@smoke` / `@regression` tags in test names.
- Validate with:

```bash
npm run dev:cli -- run --tags smoke
```

### Phase 4: Port performance flows

- Convert ReadyAPI load scenarios into performance specs.
- Externalize environment inputs via config + `API_TEST_*` runtime vars.
- Validate with:

```bash
npm run dev:cli -- perf --environment qa --ci
```

### Phase 5: Reporting and handoff

- Confirm report flow in `reports/latest/`.
- Archive comparison evidence from ReadyAPI vs mic-check runs.
- Train contributors on CLI usage, tags, and environment handling.

## Practical migration tips

- Start with one journey end-to-end, then templatize.
- Keep old ReadyAPI suite read-only during parity checks.
- Prefer small helper functions over large monolithic scripts.
- Treat secrets as environment variables only; never hardcode in tests or YAML.
