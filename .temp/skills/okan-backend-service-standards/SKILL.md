---
name: okan-backend-service-standards
description: Strict architecture standard for Okan/Monetari NestJS backend services. Use when Codex designs a new backend service, creates or reviews NestJS feature modules, evaluates backend service structure, reviews AppModule wiring, organizes HTTP/webhook/worker/cron/indexer entrypoints, or flags service-standard drift.
---

# Okan Backend Service Standards

Use this skill as a strict architecture standard. Flag drift in any backend service, but do not rewrite broad existing structure unless the user asks for a refactor.

Related backend standards: use `okan-backend-usecase-pattern` for business-action usecases, `okan-backend-env-config` for environment/config wiring, and `okan-test-naming` for backend test classification.

## Core Rule

Organize NestJS backends as feature modules under `src/modules/<feature>/`. Each feature owns its transport adapters, usecases, endpoint definitions, tests, and feature-local persistence or external adapters when needed.

Do not use feature `*.service.ts` files as business-logic containers. Business actions belong in usecases. Shared behavior belongs in clearly named helpers, domain objects, or adapters.

## Simplicity Rule

Prefer existing project patterns, built-in Nest/TypeORM tools, and straightforward code over custom infrastructure. Do not add helpers, abstraction layers, config machinery, or generated structure unless they remove real complexity or match an established local pattern.

Avoid Immediately Invoked Function Expressions when a named variable, direct expression, or small helper is clearer.

## Expected Tree

Use this tree for new backend services and new features:

```text
src/
  app.module.ts
  main.ts
  auth/
  common/
  config/
  database/
  shared/
  modules/
    bookings/
      bookings.module.ts
      bookings.controller.ts
      definitions/
        create-booking.definition.ts
        create-booking.definition.spec.ts
      usecases/
        create-booking.usecase.ts
        cancel-booking.usecase.ts
      entities/
        booking.entity.ts
      repositories/
        booking.repository.ts
      adapters/
        payment-webhook.adapter.ts
```

Rules:

- Put features under `src/modules/<feature>/`, using plural or domain-consistent names.
- Keep endpoint contracts in `definitions/`. Prefer one `<action>.definition.ts` per endpoint/usecase and place request DTOs, response DTOs, validation decorators, and definition-level tests there. Avoid separate `*.dto.ts` files unless the app already uses that older pattern.
- Keep business actions in `usecases/`, one meaningful action per file.
- Keep feature-local entities, repositories, provider adapters, schedulers, consumers, and webhook handlers inside the owning feature.
- Prefer concrete feature-local repositories for single-feature, single-implementation persistence; introduce abstract repository ports only when reuse, multiple implementations, or a real usecase boundary justifies them.
- Use top-level `auth`, `common`, `config`, `database`, and `shared` only for real cross-cutting code.
- Move code out of a feature only after at least two features or services genuinely need it.

## AppModule Standard

Keep `AppModule` thin. It may contain:

- global framework setup, such as config, database, queues, schedulers, validation, and app-wide middleware.
- feature module imports.
- root global providers such as `APP_GUARD`, `APP_FILTER`, `APP_PIPE`, and `APP_INTERCEPTOR`.

Do not register feature controllers or feature business providers directly in `AppModule`.

Prefer:

```ts
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    BookingsModule,
    PaymentsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
```

Feature modules own feature wiring:

```ts
@Module({
  imports: [TypeOrmModule.forFeature([Booking])],
  controllers: [BookingsController],
  providers: [
    CreateBookingUseCase,
    CancelBookingUseCase,
    BookingRepository,
    PaymentWebhookAdapter,
  ],
  exports: [CreateBookingUseCase],
})
export class BookingsModule {}
```

## Feature Boundary

A feature module may own:

- HTTP controllers.
- webhook controllers or adapters.
- queue consumers and producers.
- cron or scheduler entrypoints.
- indexer/event adapters.
- usecases.
- feature-local repositories, entities, adapters, mappers, and tests.

All entrypoints follow the same rule: extract transport context, build usecase input, call the usecase, and map output or errors back to the transport.

## Services Rule

Do not create `bookings.service.ts`, `users.service.ts`, or similar feature services for business actions.

Use these alternatives:

- `usecases/create-booking.usecase.ts` for an action.
- `repositories/booking.repository.ts` for persistence access.
- `adapters/payment-provider.adapter.ts` for external provider integration.
- `helpers/booking-expiration.helper.ts` for pure reusable logic.
- domain objects or value objects for invariants and state transitions.

If an existing feature already has a large service, flag the drift and recommend moving new behavior into usecases. Do not require a broad service split unless the user asks.

## Persistence And Packages

Keep service-specific persistence app-local first:

- put feature-specific entities and repositories under the feature.
- prefer concrete repositories exported by the feature module for simple app-owned persistence.
- add abstract repository ports only when the domain/application boundary benefits from decoupling.
- put app-wide database setup under `src/database`.
- keep migrations wherever the service's existing migration setup expects them.
- move entities, repositories, or migrations to `packages/db` only when multiple services actually share them.

Do not make a shared database package the default for a new app just because one exists in another backend.

## External Adapters

Keep provider clients and adapters in the owning feature when only one feature uses them. Move them to `src/shared`, `src/common`, or a package only when reuse is real.

Avoid leaking provider SDK objects, HTTP clients, RPC clients, or raw external response shapes across feature boundaries.

## Review Checklist

When designing or reviewing a service, check:

- Are all features under `src/modules/<feature>/`?
- Is `AppModule` thin and free of feature controllers/providers?
- Are business actions in `usecases/` rather than feature services?
- Does each feature own its controllers/adapters, definitions, usecases, tests, and local persistence?
- Are `auth`, `common`, `config`, `database`, and `shared` limited to cross-cutting code?
- Are provider adapters feature-owned unless reused?
- Is service-specific persistence local before becoming shared?
- Is the implementation simpler than a custom abstraction or shared package?
- Are concrete repositories used where an abstraction would add no value?
- Are avoidable IIFEs avoided?
- Do HTTP, webhook, worker, cron, queue, and indexer entrypoints all call usecases instead of owning business logic?
- Is existing drift flagged without forcing a broad rewrite?

## Output Style

Be strict and concrete. For new services or features, provide the target tree and module wiring. For reviews, lead with architecture violations and exact target structure. If existing code violates this standard, say so plainly and recommend the next new-code direction before suggesting a large refactor.
