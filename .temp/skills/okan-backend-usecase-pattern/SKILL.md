---
name: okan-backend-usecase-pattern
description: Strict standard for designing, implementing, reviewing, or refactoring Okan/Monetari NestJS backend usecases. Use when Codex works on backend usecase patterns, one-usecase-per-business-action design, application-layer usecase files for HTTP endpoints, webhooks, workers, cron jobs, or indexers, controller-to-usecase mapping, usecase tests, or enforcing Okan backend standards.
---

# Okan Backend Usecase Pattern

Use this skill as a strict backend standard. Prefer it over nearby drift unless the user explicitly asks to preserve an existing exception.

Related backend standards: use `okan-backend-service-standards` for module/service shape, `okan-backend-env-config` for configuration, and `okan-test-naming` for integration/e2e/live test classification.

## Core Rule

Treat a usecase as one meaningful business action. The action may be triggered by an HTTP endpoint, webhook, worker, cron job, CLI command, or indexer event. Do not group multiple business actions into one usecase just because they share a controller or route prefix.

Prefer straightforward usecases over custom plumbing. Do not create helper layers, ports, factories, or indirection unless they remove real duplication or protect a meaningful boundary.

## Workflow

1. Inspect the local app shape before changing or judging code: application module, nearby usecases, controllers/adapters, repository ports, domain errors, and tests.
2. Name the business action in verb-noun form, such as `complete-onboarding`, `handle-sumsub-webhook`, `get-portfolio`, or `sync-user`.
3. Put the usecase in the application layer, preferably `src/application/use-cases/<domain>/<verb-noun>.usecase.ts`.
4. Keep the usecase as a NestJS provider with `@Injectable()` and constructor-injected dependencies.
5. Keep controllers and external adapters thin: extract transport context, build input, call `execute()`, map output.
6. Add or require focused tests for every non-trivial usecase.

## File Shape

Use this shape for new usecases:

```ts
import { Injectable } from '@nestjs/common';
import { BaseClass } from '../../../domain/utils/base-class';
import { DomainError } from '../../../domain/errors/domain.error';
import { ExampleRepository } from '../../../domain/repositories/example.repository';

export class CompleteThingInput extends BaseClass {
  userId: string;
  thingId: string;
}

export class CompleteThingOutput extends BaseClass {
  id: string;
  completedAt: Date;
}

@Injectable()
export class CompleteThingUseCase {
  constructor(private readonly exampleRepository: ExampleRepository) {}

  async execute(input: CompleteThingInput): Promise<CompleteThingOutput> {
    const thing = await this.exampleRepository.findById(input.thingId);

    if (!thing || thing.userId !== input.userId) {
      throw new DomainError('Thing not found');
    }

    thing.complete();
    const saved = await this.exampleRepository.save(thing);

    return CompleteThingOutput.create({
      id: saved.id,
      completedAt: saved.completedAt,
    });
  }
}
```

Requirements:

- Name files `<verb-noun>.usecase.ts`.
- Name classes `<VerbNoun>UseCase`.
- Define colocated `<VerbNoun>Input` for every action that accepts data.
- Define colocated `<VerbNoun>Output` for every action that returns data.
- Use local `BaseClass.create(...)` for input/output construction when that convention exists.
- Use `execute(...)` as the public method. Do not expose multiple public business methods from one usecase.
- Return `Promise<void>` only for command actions that intentionally return no data.

## Boundaries

Usecases may depend on:

- concrete app-local repositories when the app intentionally owns persistence locally and only one implementation exists.
- domain/application repository ports when decoupling, reuse, multiple implementations, or external package boundaries justify them.
- service ports for external systems.
- domain services.
- config providers, clocks, request-context helpers, loggers, and transaction decorators when the app already uses them.

Usecases must not depend on:

- HTTP DTO classes, Nest `Request`/`Response`, controllers, decorators, guards, or interceptors.
- TypeORM repositories/managers/entities from shared infrastructure packages unless the local app intentionally treats its own persistence entities/repositories as application-owned dependencies.
- provider SDK clients, raw RPC clients, or third-party response objects unless wrapped by a domain/application port.
- response DTOs, Swagger decorators, or transport-specific status codes.

For webhooks, pass raw data needed for signature verification as plain input fields, such as `rawBody`, signature headers, and parsed body. Keep provider SDK objects outside the usecase contract.

## Controller And Adapter Rule

Controllers, workers, cron handlers, and indexer adapters should only:

- read current user/admin/system context.
- read params, body, headers, or job payload.
- use request/response classes from feature-local `definitions/<verb-noun>.definition.ts` for HTTP endpoint contracts.
- build `<VerbNoun>Input.create(...)`.
- call `useCase.execute(input)`.
- map `<VerbNoun>Output` to the transport response class from the definition file.

Move authorization decisions, state transitions, idempotency checks, persistence orchestration, and external-service orchestration into the usecase or a domain/application service.

## Module Wiring

Register usecases as providers in the application module and export them for infrastructure modules that need them. Do not let controllers instantiate usecases manually.

Prefer:

```ts
@Module({
  providers: [CompleteThingUseCase],
  exports: [CompleteThingUseCase],
})
export class ApplicationModule {}
```

## Errors And Transactions

- Throw domain/application errors from usecases, such as `DomainError`, `NotFoundError`, `AuthorizationError`, or local equivalents.
- Do not throw Nest HTTP exceptions from usecases.
- Let HTTP exception filters/controllers translate application errors into transport responses.
- Put transaction boundaries around the usecase when the action coordinates multiple writes or write-plus-side-effect state that must stay consistent.
- Keep transaction usage at the application boundary; do not scatter transaction ownership across repositories and controllers.

## Complexity Gates

Treat these as strict review gates:

- Every non-trivial usecase needs focused unit tests with mocked repositories, ports, config, and clocks.
- A usecase must have one reason to change: one business action.
- Split or justify a usecase that mixes unrelated actions, contains large parsing blocks, owns repeated provider-specific logic, or has deeply nested branching.
- Extract shared rules into domain services or pure helpers.
- Extract provider/API details into ports and infrastructure adapters.
- Avoid primitive soup and long positional arguments; use input classes.
- Avoid `any`, broad casts, and hidden request/SDK coupling in usecase contracts.
- Avoid avoidable IIFEs; use direct expressions, named variables, or small helpers.
- Avoid unnecessary helper layers or custom config/plumbing around a single call site.

## Review Checklist

When reviewing or proposing a usecase, explicitly check:

- Is this exactly one business action?
- Is the file/class/input/output naming correct?
- Is `execute()` the only public business method?
- Are controllers/adapters thin?
- Are HTTP, Swagger, SDK, and raw infrastructure details kept out of the usecase contract?
- Are dependencies injected as the simplest valid local dependency: concrete repository for app-local persistence, or a port/service when decoupling is useful?
- Are errors domain/application errors?
- Are transaction boundaries clear?
- Are tests focused on success, authorization/invariant failures, idempotency or duplicate handling, external-port failures, and important edge cases?

## Output Style

When applying this skill, be direct and strict. For implementation guidance, provide the target usecase shape and the required tests. For review, lead with violations and exact fixes. If local code conflicts with this standard, call out the drift and ask the user only when preserving the drift is a real product or migration decision.
