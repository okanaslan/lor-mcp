---
name: okan-test-naming
description: Classify and name backend tests using Okan's repo convention: real database tests are integration tests, Supertest or app HTTP boundary tests are e2e tests, and external service or network API tests are live tests. Use when asked about test naming, integration vs e2e vs live tests, Jest test organization, backend test structure, CI inclusion, or whether a test file is named correctly.
---

# Okan Test Naming

Classify tests by the strongest boundary or dependency they exercise.

Related backend standards: use `okan-backend-usecase-pattern` for usecase test expectations, `okan-backend-service-standards` for service-level placement, and `okan-backend-env-config` when env/config tests are involved.

## Core Rules

- Real database, repository, or internal infrastructure without HTTP => `integration`, named `*.integration-spec.ts`.
- Nest app/controller HTTP boundary through Supertest => `e2e`, named `*.e2e-spec.ts`.
- External service, provider, or network API => `live`, named `*.live.integration-spec.ts` or `*.live.e2e-spec.ts`.

## Mixed Cases

- Real DB + direct repository/use case/service call => `integration`.
- Real DB + Supertest/app HTTP boundary => `e2e`.
- Supertest/app HTTP boundary + external provider/network => `live.e2e`.
- Direct repository/use case/service call + external provider/network => `live.integration`.
- Mocked DB or provider tests stay unit tests unless they boot the HTTP boundary.

## Organization

- Keep ordinary unit tests in the app's existing unit-test location.
- Put manually run real-DB tests under `test/integration`.
- Keep live/provider tests out of default CI unless CI intentionally provisions network credentials and accepts provider flake risk.
- Use explicit scripts such as `test:integration` or `test:live` for special setup.
- Do not hide DB or network requirements inside normal unit-test commands.

## Output

Use numbered classification blocks, not tables:

```markdown
1. **`example.repository.integration-spec.ts`**
   kind: integration
   reason: real DB repository test, no HTTP boundary
   CI: keep manual until Postgres is provisioned
```

## Examples

- `market-pricing-config-event.repository.integration-spec.ts`: real DB repository query, no HTTP.
- `pyth-xauusd-history.e2e-spec.ts`: Supertest request against the app/controller boundary.
- `pyth-xauusd-history.live.e2e-spec.ts`: Supertest plus live Pyth/benchmarks network.
