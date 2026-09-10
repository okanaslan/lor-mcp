import type { McpServer } from "@mcp/server";
import * as z from "zod/v4";
import { correlateResult, errorResult, okResult } from "@src/tools/response.ts";
import { outputSchemaFor } from "@src/tools/output_schemas.ts";
import { toolPolicy } from "@src/tools/policy.ts";
import {
  DEFAULT_SKILLS_INDEX_URI,
  listBundledSkills,
  loadBundledSkill,
  readBundledFile,
  skillResourceUri,
} from "@src/skills/bundled_skills.ts";

export function registerBundledSkillResources(server: McpServer): void {
  const skills = listBundledSkills();
  server.registerTool(
    "list_default_skills",
    {
      description:
        "List bundled default skill names, aliases, versions and resource URIs. No registry database access or local installation.",
      inputSchema: z.strictObject({}),
      outputSchema: outputSchemaFor("list_default_skills"),
      annotations: toolPolicy("list_default_skills"),
    },
    () =>
      correlateResult(
        okResult({ skills }, "Bundled default skills."),
        crypto.randomUUID(),
      ),
  );
  server.registerTool("get_default_skill", {
    description:
      "Read one bundled default skill or its listed supporting file by canonical name or alias. Use when the client cannot read MCP resources. Does not install files or access catalog rows.",
    inputSchema: z.strictObject({
      name: z.string().min(1).max(64),
      path: z.string().min(1).max(256).default("SKILL.md"),
    }),
    outputSchema: outputSchemaFor("get_default_skill"),
    annotations: toolPolicy("get_default_skill"),
  }, async ({ name, path }: { name: string; path: string }) => {
    const entry = skills.find((skill) =>
      skill.name === name || skill.aliases.includes(name)
    );
    const result = !entry || !entry.files.includes(path)
      ? errorResult(
        "not_found",
        "Bundled skill or supporting file not found. List defaults and use a listed name and file.",
      )
      : okResult({
        name: entry.name,
        version: entry.version,
        path,
        content: await readBundledFile(entry.name, path),
      }, "Loaded bundled skill instructions.");
    return correlateResult(result, crypto.randomUUID());
  });
  server.registerResource(
    "lor-default-skills",
    DEFAULT_SKILLS_INDEX_URI,
    {
      title: "LOR Default Skills",
      description:
        "Bundled skill names, versions, aliases, and file URIs. Read one SKILL.md to use it; local installation is optional and happens on the client machine.",
      mimeType: "application/json",
    },
    (uri: URL) => ({
      contents: [{
        uri: uri.href,
        mimeType: "application/json",
        text: JSON.stringify({ schemaVersion: 1, skills }),
      }],
    }),
  );

  for (const skill of skills) {
    server.registerResource(
      `${skill.name}-manifest`,
      skill.manifestUri,
      {
        description:
          `${skill.name} ${skill.version} file sizes and SHA-256 checksums for local installation.`,
        mimeType: "application/json",
      },
      async (uri: URL) => ({
        contents: [{
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify((await loadBundledSkill(skill.name)).manifest),
        }],
      }),
    );
    for (const path of skill.files) {
      server.registerResource(
        `${skill.name}/${path}`,
        skillResourceUri(skill.name, skill.version, path),
        {
          description: path === "SKILL.md"
            ? skill.description
            : `Supporting instructions for ${skill.name}: ${path}`,
          mimeType: "text/markdown",
        },
        async (uri: URL) => ({
          contents: [{
            uri: uri.href,
            mimeType: "text/markdown",
            text: await readBundledFile(skill.name, path),
          }],
        }),
      );
    }
  }
}
