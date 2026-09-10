import { normalizeWorkspace } from "@src/catalog/workspace.ts";
import { LorError } from "@src/errors.ts";
import { READ_TOOLS } from "@src/tools/policy.ts";

export interface AccessPolicy {
  workspaces: readonly string[];
  globalRead: boolean;
  globalWrite: boolean;
  localFiles: boolean;
  aliases: boolean;
}

// The host supplies this policy. Tool arguments only identify requested targets.
export async function authorizeOperation(
  policy: AccessPolicy,
  resolve: (workspace: string) => string | Promise<string>,
  name: string,
  input: unknown,
): Promise<void> {
  if (!input || typeof input !== "object") deny();
  const fields = input as Record<string, unknown>;
  const targets = [
    fields.workspace,
    fields.sourceWorkspace,
    fields.targetWorkspace,
  ];
  if (name === "register_workspace_alias") {
    if (!policy.aliases) deny();
    targets.push(fields.alias);
  }
  for (const target of targets) {
    if (typeof target !== "string") continue;
    const canonical = await resolve(normalizeWorkspace(target));
    // Policy names are canonical identifiers, not dynamically resolved aliases.
    if (
      !policy.workspaces.some((allowed) =>
        normalizeWorkspace(allowed) === canonical
      )
    ) deny();
  }
  const globalCapable =
    /skill|subagent|catalog_health|usage_analytics|workspace_diagnostics/.test(
      name,
    ) &&
    !/workspace_catalog_sync|clear_workspace|file_sync/.test(name);
  const globalRequested = fields.scope === "global" ||
    (globalCapable && fields.scope !== "workspace") ||
    name === "promote_skill_to_global";
  if (
    globalRequested &&
    !(READ_TOOLS.has(name) ? policy.globalRead : policy.globalWrite)
  ) deny();
  if (name.includes("skill_file_sync")) {
    if (
      !policy.localFiles || (fields.scope !== "workspace" && !policy.globalRead)
    ) deny();
  }
}

function deny(): never {
  throw new LorError(
    "access_denied",
    "The configured caller policy does not permit this operation.",
  );
}
