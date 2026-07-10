---
name: okan-backend-env-config
description: Strict environment configuration standard for Okan/Monetari NestJS backends. Use when Codex designs, implements, or reviews backend env config, NestJS ConfigModule wiring, Zod environment validation, .env file loading conventions, example env files, adding new environment variables, config tests, or config drift.
---

# Okan Backend Env Config

Use this skill as a strict env/config standard. Flag drift everywhere, but do not plan broad rewrites unless the user asks.

Related backend standards: use `okan-backend-service-standards` for service/module ownership, `okan-backend-usecase-pattern` for application behavior, and `okan-test-naming` for tests around config behavior.

## Core Rule

Validate raw environment variables once at application startup, map them into grouped configuration namespaces, and make the rest of the application read configuration through Nest config access instead of `process.env`.

Required files:

```text
src/infrastructure/config/
  env.validation.ts
  env.config.ts
```

## AppModule Wiring

Wire config in the root module with `ConfigModule.forRoot`:

```ts
import { ConfigModule } from '@nestjs/config';
import appConfig from './infrastructure/config/env.config';
import { validateEnv } from './infrastructure/config/env.validation';

let nodeEnv = 'development';
if (process.env.NODE_ENV !== undefined) {
  nodeEnv = process.env.NODE_ENV;
}

const envFilePath = [
  `../../.env.investor.${nodeEnv}`,
  '../../.env.investor',
  `../../.env.shared.${nodeEnv}`,
  '../../.env.shared',
];

ConfigModule.forRoot({
  isGlobal: true,
  envFilePath,
  load: [appConfig],
  validate: validateEnv,
});
```

Rules:

- Load app-specific files before shared files: `.env.<app>.<NODE_ENV>`, `.env.<app>`, `.env.shared.<NODE_ENV>`, `.env.shared`.
- Use the actual app name in file paths, such as `investor`, `management`, or `chain-indexer`.
- Do not add custom env loaders, fallback chains, or config wrappers when `ConfigModule` and the existing env-file order are enough.
- Keep direct `process.env` reads inside config, bootstrap, and TypeORM data-source files only.
- Do not read `process.env` from controllers, usecases, repositories, adapters, guards, filters, or tests except when testing `validateEnv`.

## Validation File

Make `env.validation.ts` own the raw env schema and startup validation:

```ts
import { z } from 'zod';

export const REQUEST_TIMEOUT_MS_DEFAULT = 10_000;

const optionalAddress = z
  .string()
  .refine((value) => value === '' || /^0x[0-9a-fA-F]{40}$/.test(value), {
    message: 'must be empty or a 0x-prefixed 20-byte hex address',
  })
  .transform((value): string | null =>
    value === '' ? null : value.toLowerCase(),
  );

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PORT: z.coerce.number().int().positive(),
  DATABASE_URL: z.url(),
  EXTERNAL_API_KEY: z.string().min(1),
  REQUEST_TIMEOUT_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(REQUEST_TIMEOUT_MS_DEFAULT),
  OPTIONAL_CONTRACT_ADDRESS: optionalAddress,
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    throw new Error(`Environment validation failed:\n${formatted}`);
  }

  return result.data;
}
```

Rules:

- Use Zod object schemas for all env vars.
- Use `z.infer<typeof envSchema>` for the `Env` type unless a manual type is strictly clearer.
- Use `z.coerce.number().int()` for numeric env vars.
- Use `z.enum(...)` for finite string choices.
- Use `z.url()` or stricter validators for URLs.
- Use custom `refine` or library validators for domain values such as chain addresses.
- Format validation failures as a readable list of `path: message`.

## Config Mapping File

Make `env.config.ts` map validated env into grouped config namespaces:

```ts
import { Env, validateEnv } from './env.validation';

let cachedEnv: Env;

function getEnv(): Env {
  if (!cachedEnv) {
    cachedEnv = validateEnv(process.env);
  }
  return cachedEnv;
}

export default () => {
  const env = getEnv();

  return {
    app: {
      nodeEnv: env.NODE_ENV,
      port: env.PORT,
    },
    db: {
      url: env.DATABASE_URL,
    },
    externalApi: {
      apiKey: env.EXTERNAL_API_KEY,
      requestTimeoutMs: env.REQUEST_TIMEOUT_MS,
    },
    contracts: {
      optionalContractAddress: env.OPTIONAL_CONTRACT_ADDRESS,
    },
  };
};
```

Rules:

- Group config by domain or provider, such as `app`, `db`, `chain`, `paymaster`, `privy`, `sumsub`, or `pyth`.
- Keep raw env names out of application code.
- Put derived config values here when they are config-shaped, deterministic, and cheap.
- Keep config mapping straightforward; avoid custom fallback logic unless a concrete environment/deploy requirement needs it.
- Do not put business logic, remote calls, database calls, or async provider initialization in `env.config.ts`.

## Defaults And Optional Values

Defaults are allowed only for non-secret operational limits, such as timeouts, cache TTLs, batch sizes, body-size limits, and rate limits.

Never default:

- secrets or API keys.
- credentials.
- private or public URLs.
- database URLs.
- chain IDs.
- contract addresses that must be deployed.
- feature-critical identifiers.

Normalize optional env values inside the Zod schema. Prefer `null` or `undefined` over empty strings after validation. Consumers should not repeatedly parse empty strings.

## Example Env Files

Keep examples synchronized with the schema:

- Put app-specific values in `example.env.<app>`.
- Put shared values in `example.env.shared`.
- Every schema key must appear in exactly the appropriate example file unless the project has an explicit reason to duplicate it.
- Every added or renamed env var must update the matching example env file in the same change.
- Use safe placeholders for secrets and credentials.
- Add short comments when a value is public, browser-exposed, server-only, optional, or intentionally blank.
- Do not commit real secrets.

## Tests

When env config changes, require focused tests for:

- missing required vars fail with useful messages.
- invalid values fail, such as malformed URLs, bad numbers, invalid enums, or bad addresses.
- numeric coercion and safe defaults work.
- optional empty-string values normalize to `null` or `undefined`.
- `env.config.ts` maps raw env values into the expected grouped namespace keys.
- example env files stay synchronized with the schema keys when practical.

## Review Checklist

Check every env/config change for:

- Are `env.validation.ts` and `env.config.ts` in `src/infrastructure/config/`?
- Is `ConfigModule.forRoot` wired with `isGlobal`, `envFilePath`, `load`, and `validate`?
- Does env-file order load app-specific files before shared files?
- Is every raw env var validated by Zod?
- Are defaults limited to safe operational limits?
- Are optional values normalized once in the schema?
- Is app code free of direct `process.env` reads outside config, bootstrap, and TypeORM data-source files?
- Are grouped config namespaces used instead of raw env names?
- Are example env files synchronized and secret-safe?
- Did every added or renamed env var update the matching example env file in the same change?
- Is the config path using existing `ConfigModule`/Zod patterns instead of custom loaders?
- Are focused tests updated?

## Output Style

Be strict and practical. For implementation, provide the required files and config snippets. For review, lead with config safety violations, example-env drift, and direct `process.env` reads. If existing code drifts from this standard, flag it and recommend the target shape without forcing a broad rewrite.
