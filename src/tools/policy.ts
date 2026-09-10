export const READ_TOOLS = new Set([
  "list_default_skills",
  "get_default_skill",
  "get_operation",
  "list_skills",
  "list_subagents",
  "get_skill_detail",
  "get_subagent_detail",
  "export_catalog",
  "check_catalog_health",
  "get_workspace_diagnostics",
  "get_usage_analytics",
  "list_workspace_notes",
  "find_matching_workspace_note",
  "get_workspace_note",
  "generate_agent_prompt",
  "find_matching_skill",
  "find_matching_subagent",
  "preview_workspace_catalog_sync",
  "preview_skill_file_sync",
]);

export function toolPolicy(name: string) {
  const readOnlyHint = READ_TOOLS.has(name);
  return {
    readOnlyHint,
    destructiveHint: !readOnlyHint && name !== "propose_skill_update" &&
      !name.startsWith("introduce_") && name !== "remember_workspace_note",
    // Reads may increment usage counters but do not change catalog content.
    idempotentHint: readOnlyHint,
    openWorldHint: false,
  };
}

export function toolEffectDescription(name: string): string {
  if (name === "apply_skill_file_sync") {
    return " Requires previewDigest from the reviewed preview. Writes a configured local SKILL.md with a recovery copy; catalog approval alone does not authorize filesystem access.";
  }
  if (name.startsWith("update_")) {
    return " Requires expectedRevision from a fresh detail read. Updates supplied metadata only. Omitted fields remain unchanged; supplied arrays and routing objects replace; null clears nullable fields. Context changes use propose_skill_update then apply_skill_update.";
  }
  if (name.startsWith("introduce_")) {
    return " Defaults to global scope; use scope=workspace for project-specific entries. Existing names return a conflict; inspect the existing entry before updating. Does not install local files.";
  }
  if (name === "propose_skill_update") {
    return " Stores a reviewable proposal bound to its source revision and originating workspace for 24 hours. Apply the returned proposal ID only after reviewing its exact changes.";
  }
  if (
    ["list_skills", "list_subagents", "list_workspace_notes", "export_catalog"]
      .includes(name)
  ) {
    return " Returns at most limit entries (default 20, maximum 100). Follow nextCursor with unchanged filters and limit; restart on invalid_cursor. Lists contain summaries; load instructions by detail lookup.";
  }
  if (["remove_skill", "remove_subagent"].includes(name)) {
    return " Requires expectedRevision from a fresh detail read; stale deletion is refused.";
  }
  if (name === "apply_workspace_catalog_sync") {
    return " Requires previewDigest from the reviewed preview. Imports missing entries without overwriting existing ones; multi-entry operations can partially complete.";
  }
  if (name.startsWith("preview_")) {
    return " Preview only; does not apply the proposed changes.";
  }
  if (READ_TOOLS.has(name)) {
    return " Does not modify catalog content; retrieval may increment usage counters.";
  }
  return " Mutates stored state in the selected scope. Confirmation flags are acknowledgments, not access grants.";
}
