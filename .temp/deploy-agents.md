# Deployment Agent Instructions

Use this file with root `AGENTS.md` for deployment planning and configuration
review.

## Provider Defaults

- Render is suitable for basic services, PostgreSQL, Redis-compatible key/value
  storage, and static sites.
- Google Cloud defaults may include Cloud Run, Cloud Storage, Cloud SQL,
  Memorystore, Secret Manager, and Artifact Registry.
- Follow the target project's existing provider and infrastructure conventions.

## Relevant Skills

- `okan-render-deployment-checker`: inspect or validate existing Render
  services, deploys, databases, environment variables, logs, health checks, and
  configuration drift.
- `find-skills`: discover provider-specific deployment skills when needed.
- Use Context7 for current provider, SDK, CLI, and service documentation.
- Skills do not expand folder ownership, approve tools, or permit credential
  changes.

## Boundaries

- Do not commit credentials, service-account keys, tokens, passwords, or secret
  values.
- Use provider-managed secrets for production values.
- Ask before adding Terraform, Cloud Build, provider CLI automation, active CI,
  or deployment commands.
- Do not modify application code or infrastructure outside the assigned folder.

## Verification

- Validate configuration syntax with the project's available tools.
- Check health endpoints, environment requirements, build/start commands,
  migrations, logging, and rollback assumptions.
- Report provider assumptions, required approvals, and skipped checks.
