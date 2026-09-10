import {
  listBundledSkills,
  loadBundledSkill,
} from "@src/skills/bundled_skills.ts";
import {
  installSkills,
  previewSkillInstall,
} from "@src/skills/local_skill_installer.ts";

const HELP = `LOR default skill installer (runs on this machine)

deno task skills list
deno task skills preview --root /absolute/skill/root --skill lor-manage-skill
deno task skills install --root /absolute/skill/root --skill lor-manage-skill --plan <preview-hash>

The root must already exist. Preview never writes. Install preserves edited or
unmanaged folders and refuses stale previews. It does not register catalog rows.
Optional: --server https://host/mcp --version 1.0.0 to fetch MCP resources.
Remote fetching requires an explicit --allow-net grant when invoking deno run;
the local-only task has no network permission. Authenticated servers should be
accessed through a host's authenticated MCP connection instead of this CLI.
`;

export async function runSkillCli(args: string[]): Promise<unknown> {
  const [command, ...rest] = args;
  if (!command || command === "--help") return HELP;
  if (command === "list" && !rest.length) {
    return { skills: listBundledSkills() };
  }
  if (command !== "preview" && command !== "install") {
    throw new Error(
      "Expected list, preview, or install. Use --help for usage.",
    );
  }
  const flags = new Map<string, string>();
  for (let i = 0; i < rest.length; i += 2) {
    const key = rest[i];
    const value = rest[i + 1];
    if (
      !["--root", "--skill", "--plan", "--server", "--version"].includes(key) ||
      !value || value.startsWith("--") || flags.has(key)
    ) throw new Error(`Invalid or repeated option: ${key}`);
    flags.set(key, value);
  }
  const root = flags.get("--root");
  const name = flags.get("--skill");
  const plan = flags.get("--plan");
  const endpoint = flags.get("--server");
  const version = flags.get("--version");
  if (!root || !name) throw new Error("--root and --skill are required.");
  if (command === "install" && !plan) {
    throw new Error("Run preview first and pass its hash with --plan.");
  }
  if (command === "preview" && plan) {
    throw new Error("--plan is only valid with install.");
  }
  if (Boolean(endpoint) !== Boolean(version)) {
    throw new Error("--server and --version must be supplied together.");
  }
  const bundle = endpoint && version
    ? await (await import("@src/skills/remote_skill_package.ts"))
      .fetchRemoteSkill(endpoint, name, version)
    : await loadBundledSkill(name);
  if (command === "preview") return await previewSkillInstall(root, [bundle]);
  const applied = await installSkills(root, [bundle], plan!);
  return {
    ...applied,
    applied: true,
    verification: await previewSkillInstall(root, [bundle]),
  };
}

if (import.meta.main) {
  try {
    const result = await runSkillCli(Deno.args);
    console.log(
      typeof result === "string" ? result : JSON.stringify(result, null, 2),
    );
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Skill installation failed.",
    );
    Deno.exitCode = 1;
  }
}
