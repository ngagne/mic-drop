# mic-check

A TypeScript API testing platform with a CLI-first workflow for functional and performance journeys.

## What it does

- Discovers journeys from `src/journeys/*`.
- Runs functional tests through Vitest.
- Runs performance tests by shelling out to `k6 run` per discovered performance test file.
- Generates HTML + Allure-style artifacts under `reports/`.

## Architecture at a glance

- **CLI layer** (`src/cli/*`): command parsing and option normalization.
- **Core runner** (`src/core/runner.ts`): orchestrates discovery, execution, and reporting.
- **Discovery** (`src/core/discovery/*`): finds `functional/**/*.test.ts` and `performance/**/*.test.ts`.
- **Execution**:
  - Functional: `src/core/execution/functional.ts` (Vitest programmatic API)
  - Performance: `src/core/performance/runner.ts` (`k6 run` per selected file)
- **Reporting** (`src/core/reporting/*`): writes `reports/history/run-*/`, copies latest to `reports/latest/`.
- **Config** (`config/*`): environment YAML + Zod validation + `${ENV_VAR}` interpolation.

## Prerequisites

- Node.js 20+
- npm 10+
- k6 (required for `--performance` / `perf`)

## Setup

```bash
npm install
npm run build
```

## CLI usage

```bash
api-test list
api-test run [journey] [options]
api-test perf [journey] [options]
```

### Commands

- `list`: prints available journeys and test counts.
- `run`: runs functional tests by default.
- `perf`: alias for `run --performance`.

### Supported `run`/`perf` options

- `--performance`: force performance mode (normally functional for `run`).
- `--environment <name>`: environment name (`local|dev|qa|stage|prod`). Used by performance runtime config loading.
- `--report-only`: skip execution, regenerate report from `reports/latest/raw-results.json`.
- `--parallel <n>`: sets Vitest worker count for functional runs.
- `--tags <csvOrRepeatable>`: filters functional tests by `@tag` in test names.
- `--ci`: CI-friendly behavior (no auto-open report; performance runs pass `--quiet --no-color` to k6; functional uses dot/github-actions reporters).
- `--verbose`: accepted by parser; currently reserved (no runtime behavior yet).

### Example commands

```bash
# Discover journeys
npm run dev:cli -- list

# Run all functional tests
npm run dev:cli -- run

# Run one journey with 4 workers
npm run dev:cli -- run payments --parallel 4

# Run tagged functional tests (test names must include @smoke)
npm run dev:cli -- run --tags smoke
npm run dev:cli -- run --tags smoke,regression --tags payments

# Run performance tests
npm run dev:cli -- run --performance
npm run dev:cli -- perf authentication --environment qa --ci

# Regenerate report without running tests
npm run dev:cli -- run --report-only
```

## Environment configuration

Environment files live in `config/environments/*.yml`.

Selection order:
1. `--environment <name>` CLI option
2. `ENVIRONMENT` environment variable
3. `local`

YAML supports `${ENV_VAR}` placeholders. Example:

```yaml
credentials:
  apiKey: ${QA_API_KEY}
```

Set required variables before execution:

```bash
export ENVIRONMENT=qa
export QA_API_KEY=...
export QA_CLIENT_SECRET=...
npm run dev:cli -- perf payments
```

Performance runtime exports these env vars to k6:

- `API_TEST_ENVIRONMENT`
- `API_TEST_BASE_URL`
- `API_TEST_TIMEOUT_MS`
- `API_TEST_RETRIES`
- `API_TEST_AUTH_CONTEXT_B64`
- `API_TEST_FEATURES_B64`
- `API_TEST_TEST_DATA_B64`

## Reporting flow

Each run:
1. Builds a runner payload.
2. Writes history artifacts to `reports/history/run-<timestamp>/`.
3. Generates:
   - `index.html`
   - `raw-results.json`
   - `allure-results/*`
4. Copies history output to `reports/latest/`.
5. Auto-opens `reports/latest/index.html` unless `--ci` is set.

## Development quality checks

```bash
npm run lint
npm run build
npm run test
```

## Additional docs

- `docs/writing-tests.md`
- `docs/contributing.md`
- `docs/migration-guide.md`
