import type { McpServer } from "@mcp/server";
import {
  DEFAULT_SKILLS_INDEX_URI,
  listBundledSkills,
  loadBundledSkill,
  readBundledFile,
  skillResourceUri,
} from "@src/skills/bundled_skills.ts";

export function registerBundledSkillResources(server: McpServer): void {
  const skills = listBundledSkills();
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
