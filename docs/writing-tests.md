# Writing tests

This project supports two test types per journey:

- **Functional tests**: `src/journeys/<journey>/functional/**/*.test.ts`
- **Performance tests**: `src/journeys/<journey>/performance/**/*.test.ts`

## Journey structure

```text
src/journeys/<journey>/
  functional/
  performance/
  fixtures/
  helpers/
```

## Functional tests (Vitest)

Use Vitest `describe/it/expect` and keep tests deterministic.

```ts
describe('payments functional', () => {
  it('approves card payment @smoke @payments', async () => {
    // ...
  });
});
```

Tagging guidance:
- Tags are matched from **test names** via `--tags`.
- Include tags as `@tag` in `it(...)` names.
- `--tags smoke,regression` behaves like OR matching.

Run examples:

```bash
npm run dev:cli -- run payments
npm run dev:cli -- run --tags smoke
npm run dev:cli -- run --tags smoke,regression --parallel 3
```

## Performance tests (k6-dispatched)

Performance files are discovered from `performance/**/*.test.ts`; each selected file is executed with:

```bash
k6 run [--quiet --no-color in CI] <relative-file-path>
```

Practical tips:
- Keep performance scenarios isolated (one concern per file).
- Read runtime values from `API_TEST_*` env vars.
- Avoid logging secrets from decoded auth/config payloads.

Run examples:

```bash
npm run dev:cli -- perf
npm run dev:cli -- perf authentication --environment qa
npm run dev:cli -- run --performance --ci
```

## Environment usage in tests

- Functional tests currently run through Vitest without automatic config injection.
- Performance runs load `config/environments/<env>.yml` and export `API_TEST_*` vars to k6.

## Test author checklist

- Use `.test.ts` suffix.
- Place tests in correct journey/type folder.
- Keep fixtures in `fixtures/` and protocol helpers in `helpers/`.
- Add `@tags` in test names for CLI filtering.
- Ensure tests are stable locally with `npm run test`.
