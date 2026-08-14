# V2 Feedback Summary

Status: Planning input.

The latest user feedback says LOR is most valuable as a routing, catalog,
prompt, and workspace-readiness system. It is less healthy for LOR to own
inter-agent communication or task management while the project does not control
its own Codex execution harness.

## Main Feedback

- Inter-agent communication and task management are not the right center of
  gravity for LOR right now.
- Task-related tools can create the false impression that LOR controls Codex
  execution.
- Prompt generation helpers are still useful because manual coordination remains
  practical.
- Tool responses should clearly explain the next action the caller should take.
- Tool responses should include failure guidance so the caller knows what to do
  when a suggested step fails.
- LOR should more actively encourage registration of skills and subagents.
- Workspace health should expose coverage metrics for skills and subagents.
- LOR needs a cleaner distinction between local Codex skills and LOR-registered
  skill metadata.
- The role of local `AGENTS.md` should be reviewed: LOR may augment it, generate
  parts of it, or make some local instructions unnecessary.

## V2 Product Bet

The product bet is that LOR should help a fresh, short-lived Codex agent become
well-equipped for the current task. That means selecting and explaining relevant
skills, subagents, local instructions, prompts, and failure paths rather than
tracking a network of long-lived agents.
