export const READ_TOOLS = new Set([
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
    return " Writes a configured local SKILL.md; catalog approval alone does not authorize filesystem access.";
  }
  if (name.startsWith("update_")) {
    return " Updates supplied metadata only. Omitted fields remain unchanged; supplied arrays and routing objects replace; null clears nullable fields. Context changes use propose_skill_update then apply_skill_update.";
  }
  if (name.startsWith("introduce_")) {
    return " Defaults to global scope; use scope=workspace for project-specific entries. Existing names return a conflict; inspect the existing entry before updating. Does not install local files.";
  }
  if (name === "propose_skill_update") {
    return " Stores a reviewable proposal without changing the entry. Apply the returned proposal ID only after reviewing its exact changes.";
  }
  if (name.startsWith("preview_")) {
    return " Preview only; does not apply the proposed changes.";
  }
  if (READ_TOOLS.has(name)) {
    return " Does not modify catalog content; retrieval may increment usage counters.";
  }
  return " Mutates stored state in the selected scope. Confirmation flags are acknowledgments, not access grants.";
}
