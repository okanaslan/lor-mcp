import { fingerprint } from "@src/catalog/revision.ts";
import { LOR_MCP_VERSION } from "@src/version.ts";

// Capture once at module load, not on each diagnostic read. Packaged binaries
// without source files report unavailable rather than inventing an artifact ID.
async function sourceIdentity() {
  try {
    const files: Record<string, string> = {};
    const visit = async (url: URL, prefix: string): Promise<void> => {
      for await (const entry of Deno.readDir(url)) {
        if (entry.isSymlink) continue;
        const name = prefix + entry.name;
        const child = new URL(entry.name + (entry.isDirectory ? "/" : ""), url);
        if (entry.isDirectory) await visit(child, name + "/");
        else if (entry.isFile && name.endsWith(".ts")) {
          files[name] = await Deno.readTextFile(child);
        }
      }
    };
    await visit(new URL("./", import.meta.url), "src/");
    for (const path of ["deno.json", "deno.lock", "VERSION"]) {
      files[path] = await Deno.readTextFile(
        new URL("../" + path, import.meta.url),
      );
    }
    return { buildId: fingerprint(files), buildIdSource: "source-snapshot" };
  } catch {
    return { buildId: "unavailable", buildIdSource: "source-unavailable" };
  }
}

export const BUILD_IDENTITY = Object.freeze({
  releaseVersion: LOR_MCP_VERSION,
  ...await sourceIdentity(),
});
