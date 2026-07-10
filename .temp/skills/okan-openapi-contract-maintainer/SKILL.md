---
name: okan-openapi-contract-maintainer
description: Use when adding, changing, deprecating, removing, validating, or debugging OpenAPI, Swagger, API contract annotations, generated API artifacts, docs completeness tests, or contract drift in a backend service.
---

# OpenAPI Contract Maintainer

Use this skill to keep backend public API contracts, annotations, generated OpenAPI artifacts, and contract tests synchronized.

## Operating Model

- Treat public API changes as contract changes, not incidental implementation details.
- Inspect the existing contract path before editing: route registration, middleware/auth policy, handlers, request and response types, annotations, generated artifacts, docs tests, README/API docs, and client schema generation.
- Reuse the repo's generator and validation commands. Do not hand-edit generated OpenAPI artifacts when a generator exists.
- Keep internal, admin, debug, and server-to-server routes out of public OpenAPI unless the repo explicitly documents otherwise.
- Surface breaking changes clearly: removed routes, changed response fields, changed status codes, stricter validation, renamed enums, or auth policy changes.

## Contract Workflow

1. Map the actual route behavior first: method, path, route params, query params, request body, auth/pro/admin policy, response status codes, and error mapping.
2. Update source-of-truth contract declarations: handler annotations, schema structs, enum documentation, examples, tags, deprecation markers, and security requirements.
3. Regenerate or check committed artifacts using the repo's standard command, such as `make openapi` or `make openapi-check`.
4. Update contract completeness tests so new public routes are required, removed routes are absent, deprecated routes are marked deprecated, and internal/admin routes remain excluded.
5. Update API docs or README endpoint lists when the repo maintains them manually.
6. Validate with focused API/docs tests and the repo's OpenAPI check before reporting completion.

## Review Checklist

For each changed endpoint, verify:

- Path and HTTP method match the router exactly.
- Path parameters use the same names as the route.
- Query params include defaults, allowed values, pagination semantics, and validation constraints when documented.
- Request body requiredness, nullable fields, enum values, and unknown-field behavior are represented correctly.
- Success and error status codes match handler behavior.
- Response schemas include all public fields and omit internal-only fields.
- Auth/security requirements match middleware behavior.
- Deprecated endpoints are explicitly marked deprecated.
- Removed endpoints disappear from artifacts and docs.

## Validation Expectations

Prefer the repo's own validation commands. Common checks include:

```sh
make openapi
make openapi-check
go test ./internal/api
```

Run broader backend tests when contract changes depend on service behavior. Run client/mobile schema generation only when the user explicitly asks or the repo owns that generated artifact in the same workspace.

## Avoid

- Do not edit generated OpenAPI JSON/YAML directly when source annotations or generators exist.
- Do not expose internal/admin routes in public OpenAPI.
- Do not leave annotations, generated artifacts, README/docs, and tests inconsistent.
- Do not invent undocumented request or response behavior to make the spec look nicer.
- Do not change frontend, mobile, admin dashboard, or E2E files unless explicitly requested.
