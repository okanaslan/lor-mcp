import { Client } from "@mcp/client";
import { StreamableHTTPClientTransport } from "@mcp/client-http";
import { skillResourceUri } from "@src/skills/bundled_skills.ts";
import {
  packageManifestSchema,
  type SkillPackage,
  validatePackage,
} from "@src/skills/skill_package.ts";

export async function fetchRemoteSkill(
  endpoint: string,
  name: string,
  version: string,
): Promise<SkillPackage> {
  if (
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name) || name.length > 64 ||
    !/^\d+\.\d+\.\d+$/.test(version)
  ) {
    throw new Error(
      "Use a canonical skill name and an exact major.minor.patch version.",
    );
  }
  const url = new URL(endpoint);
  if (
    url.protocol !== "https:" &&
    !(url.protocol === "http:" &&
      ["127.0.0.1", "localhost", "[::1]"].includes(url.hostname))
  ) {
    throw new Error(
      "Use HTTPS for remote servers; HTTP is allowed only on loopback.",
    );
  }
  if (url.username || url.password) {
    throw new Error("Credentials must not be embedded in the MCP URL.");
  }
  const client = new Client({ name: "lor-skill-installer", version: "1.0.0" });
  const transport = new StreamableHTTPClientTransport(url);
  try {
    await client.connect(transport);
    const read = async (uri: string): Promise<string> => {
      const result = await client.readResource({ uri });
      const content = result.contents.find((
        entry: { uri: string; text?: unknown },
      ) => entry.uri === uri);
      if (
        !content || !("text" in content) || typeof content.text !== "string"
      ) throw new Error("Expected a text skill resource.");
      if (new TextEncoder().encode(content.text).length > 1024 * 1024) {
        throw new Error("Resource exceeds the 1 MiB file limit.");
      }
      return content.text;
    };
    const manifest = packageManifestSchema.parse(
      JSON.parse(await read(skillResourceUri(name, version, "manifest.json"))),
    );
    if (manifest.name !== name || manifest.version !== version) {
      throw new Error("The server returned a different skill or version.");
    }
    const files: Record<string, string> = {};
    for (const file of manifest.files) {
      files[file.path] = await read(skillResourceUri(name, version, file.path));
    }
    const bundle = { manifest, files };
    await validatePackage(bundle);
    return bundle;
  } finally {
    try {
      await transport.terminateSession();
    } catch {
      // A failed connection or expired session may have nothing to terminate.
    } finally {
      await client.close();
    }
  }
}
