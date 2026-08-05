# Review Clean HTTP Discovery Logs

## 1. Summary

A developer reviews LOR logs and can focus on meaningful warnings instead of
expected auth discovery probes.

## 2. Actor

LOR developer or operator.

## 3. Scenario

An MCP client probes `.well-known` OAuth and OpenID Connect discovery endpoints
against the local LOR HTTP server. LOR does not implement HTTP auth yet, so the
probes return `404`, but those expected responses should not dominate warning
logs.

## 4. Flow

1. The developer runs LOR over local Streamable HTTP.
2. The MCP client sends discovery probe requests.
3. LOR returns the same `404` responses as before.
4. LOR logs expected probe requests below warning severity.
5. Unrelated client or routing problems still appear as warnings.

## 5. Expected Outcome

Operational logs remain useful without implying unsupported OAuth/OIDC behavior.

## 6. Related Feature Specs

- [HTTP Discovery Probe Logging](../feature-specs/http-discovery-probe-logging.md)
- [Future HTTP Authorization Discovery](../tech-specs/future/http-authorization-discovery.md)
- [HTTP Discovery Probe Logging](../tech-specs/done/http-discovery-probe-logging.md)

## 7. Open Questions

- Should expected discovery probes be visible only at debug level, or should
  they also have a compact metric counter?
