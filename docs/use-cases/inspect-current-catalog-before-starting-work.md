# Inspect Current Catalog Before Starting Work

## 1. Summary

A Codex user or agent lists the current Local Orchestration Router (LOR) catalog before deciding
how to approach a task.

## 2. Actor

Codex user or Codex agent.

## 3. Scenario

Before starting work, the actor wants to understand which agents and skills have
already been introduced for the requested workspace.

## 4. Flow

1. The Codex user opens a workspace where LOR MCP is configured.
2. The user or current agent asks LOR MCP to list catalog entries.
3. Local Orchestration Router (LOR) returns introduced agents and skills for the requested workspace
   workspace.
4. The actor reviews display names, projects, specialties, and tags.
5. The actor decides whether to use a listed entry, ask for a match, or
   introduce another entry.

## 5. Expected Outcome

The actor understands what catalog entries are available before selecting an
approach for the task.

## 6. Related Feature Specs

- [List Catalog Entries](../feature-specs/list-catalog-entries.md)
- [Get Catalog Entry Detail](../feature-specs/get-catalog-entry-detail.md)
- [MCP Initialization Session](../feature-specs/mcp-initialization-session.md)

## 7. Open Questions

- Should catalog lists be grouped by project, type, or specialty?
- Should empty catalogs include guidance for introducing agents or skills?
