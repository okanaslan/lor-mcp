# Base Agent Instructions

Use this file as the shared root policy for technical projects. Supporting role
files and skills are stored under `.temp/`. Add one relevant role file when
narrower stack guidance is needed.

## Operating Model

- Use Codex as the primary development agent.
- Start from current repository truth: git state, local instructions, nearby
  code, tests, and documentation.
- Treat memory and git history as references; verify facts against current
  files before relying on them.
- Prefer existing project patterns over new abstractions.
- Prefer updating the existing source-of-truth artifact over creating parallel
  notes or documentation.
- Keep changes limited to the requested task and PM-assigned folder.
- Inspect outside the assigned folder only for technical context.
- Ask before editing shared/root files or another workspace.
- Do not add tools, MCP servers, frameworks, dependencies, or automation
  without explicit approval.
- Do not commit, push, install credentials, or run destructive commands unless
  explicitly requested.

## Coordinator Model

- When the PM assigns a coordinator, it may inspect broadly for planning, but
  edits still require an assigned folder or explicit PM approval.
- Coordinator guidance does not create automatic routing or agent-to-agent
  orchestration.
- Use one specialist for narrow work. Use multiple reviewers only for high-risk
  work or when the user explicitly requests them.
- The main agent retains final judgment and merges overlapping findings by the
  underlying issue rather than reviewer wording.

## Planning And Execution

- Use plan mode for architecture, risky edits, tool changes, migrations, and
  verification strategy.
- Do not mutate files during review-only, planning-only, or learn-first tasks.
- Inspect first, ask only questions that change the plan, and finish with a
  decision-complete plan.
- Implement approved work end to end when feasible.
- Before editing, state what will change and why.
- After editing, summarize changed files and exact verification results.

## Documentation Lookup

Use Context7 for current library, framework, SDK, API, CLI, and cloud service
documentation. Resolve the library first and query with the full task.

## MCP Policy

Approved MCP/tools:

- Figma
- ClickUp
- Context7

All other MCP servers require explicit approval.

## Relevant Skills

- Use skills only when the task matches their purpose or the PM/user invokes
  one.
- Skill references do not provide automatic routing, tool approval, or
  cross-folder write permission.
- Use `.temp/skills/catalog.md` for the inventory and
  `.temp/skills/packs/*.md` for role suggestions.
- Keep `caveman` optional and user-invoked.

## Verification

- Identify the project's local command surface before editing.
- Run the narrowest meaningful verification during iteration.
- Run the project's strongest available check before handoff.
- Document missing commands, skipped checks, and assumptions.
- Keep reports direct and evidence-based. Never claim validation without
  inspecting the command output.
- For reviews, lead with findings. For implementation, report changed artifacts
  and verification. Keep operational messages short and action-oriented.
