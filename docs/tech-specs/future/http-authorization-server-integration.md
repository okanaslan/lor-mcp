# HTTP Authorization Server Integration

## 1. Summary

Future-only. This spec captures the product and integration decisions needed if
LOR later uses OAuth or OpenID Connect through a real authorization server.

This is intentionally separate from protected resource metadata and token
validation because choosing an authorization server is a larger product and
deployment decision.

## 2. Goals

- Decide whether LOR integrates with an external provider or co-locates an auth
  server.
- Define when LOR should serve authorization server metadata.
- Define whether OpenID Connect discovery is supported.
- Keep local unauthenticated mode unaffected.

## 3. Integration Options

Preferred future order:

1. External provider: LOR validates tokens issued by an existing issuer and
   serves only protected resource metadata.
2. Co-located authorization server: LOR also serves OAuth authorization server
   metadata and token-related endpoints.
3. OpenID Connect provider: LOR or the external provider supports OIDC discovery
   when identity claims are needed.

The external-provider option should be evaluated first because it keeps LOR
focused on resource-server behavior.

## 4. Metadata Responsibilities

If LOR only uses an external provider, LOR should not serve
`/.well-known/oauth-authorization-server` or
`/.well-known/openid-configuration`; those belong to the issuer.

If LOR co-locates the authorization server, it should serve the metadata paths
required by the active MCP authorization spec and include authorization, token,
registration or client metadata capabilities only when implemented.

## 5. Non-Goals

- Implement login or consent screens.
- Store users, passwords, refresh tokens, or OAuth clients.
- Add dynamic client registration in the first auth pass.
- Require OIDC for simple resource-server protection.

## 6. Verification Plan

- Metadata tests for external-provider mode proving LOR does not claim issuer
  endpoints.
- Metadata tests for co-located mode if that option is implemented later.
- Tests for client registration metadata only if that capability is implemented.
- Security review before any token-issuing code ships.

## 7. Open Questions

- Which provider should be the first supported external issuer?
- Should LOR ever issue tokens itself, or should it remain resource-server only?
- Does LOR need end-user identity claims, or are scopes enough for the first
  protected HTTP deployment?
