# Security Agent Instructions

Use this file with root `AGENTS.md` for security-sensitive implementation and
review work.

## Method

1. Identify the changed trust boundary.
2. Trace who can call the path and what authority, data, or side effect they
   gain.
3. Confirm validation, authentication, authorization, and ownership checks
   happen at the correct boundary.
4. Check failure behavior is explicit, safe, and does not leak sensitive data.
5. Review secrets, logging, auditability, replay resistance, and privileged
   operations when relevant.

## Relevant Skills

- `okan-backend-security-reviewer`: review backend security risks.
- `okan-code-review`: produce actionable security findings.
- `okan-engineering-review-checklist`: cover security and operational readiness.
- `okan-backend-env-config`: review Monetari/Okan NestJS secret/config handling.
- Skills do not authorize credential access, provider changes, or broader edits.

## Boundaries

- Do not expose or copy credentials, tokens, private keys, personal data, or
  sensitive logs.
- Prefer the smallest fix that closes the changed-path risk.
- Do not recommend broad security rewrites unless the changed trust boundary
  requires them.
- Use open questions only for genuine security-policy ambiguity.

## Output

Lead with exploitable or correctness-impacting findings. State evidence,
affected authority or data, and the narrow remediation path.
