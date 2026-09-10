import { type McpServer, ResourceTemplate } from "@mcp/server";
import * as z from "zod/v4";
import { fingerprint } from "@src/catalog/revision.ts";
import { LorError, toLorError } from "@src/errors.ts";
import {
  correlateResult,
  errorResult,
  okResult,
  type ToolResult,
} from "@src/tools/response.ts";
import type { ToolRuntime } from "@src/tools/runtime.ts";
import { outputSchemaFor } from "@src/tools/output_schemas.ts";
import { toolPolicy } from "@src/tools/policy.ts";

export const MAX_RESULT_BYTES = 256 * 1024;
export const RESULT_PAGE_CHARS = 16 * 1024;
const MAX_STORED_BYTES = 16 * 1024 * 1024;
const TTL_MS = 5 * 60 * 1000;
const encoder = new TextEncoder();
const PUBLIC_CONTEXT_TOOLS = new Set([
  "get_default_skill",
  "list_default_skills",
  "generate_agent_prompt",
]);

interface Snapshot {
  text: string;
  bytes: number;
  retainedBytes: number;
  expiresAt: number;
  revision: string;
  tool: string;
  input: unknown;
}

// Server-local, bounded snapshots, never durable write receipts.
export class ResultPages {
  #snapshots = new Map<string, Snapshot>();
  constructor(private readonly now = () => Date.now()) {}

  bound = (result: ToolResult, tool: string, input: unknown): ToolResult => {
    if (encoder.encode(JSON.stringify(result)).length <= MAX_RESULT_BYTES) {
      return result;
    }
    const requestId = String(
      result.structuredContent.requestId ?? crypto.randomUUID(),
    );
    const text = JSON.stringify(result.structuredContent);
    const bytes = encoder.encode(text).length;
    const retainedBytes = bytes +
      encoder.encode(JSON.stringify(input) ?? "null").length;
    this.expire();
    if (retainedBytes > MAX_STORED_BYTES) {
      return correlateResult(
        errorResult(
          "response_too_large",
          "Result exceeds the retained-result budget. The operation may already have completed; do not blindly retry a write. Read back the target or reduce read filters/limit.",
        ),
        requestId,
      );
    }
    let stored = [...this.#snapshots.values()].reduce(
      (sum, item) => sum + item.retainedBytes,
      0,
    );
    while (stored + retainedBytes > MAX_STORED_BYTES) {
      const key = this.#snapshots.keys().next().value!;
      stored -= this.#snapshots.get(key)!.retainedBytes;
      this.#snapshots.delete(key);
    }
    const id = crypto.randomUUID();
    const expiresAt = this.now() + TTL_MS;
    const revision = fingerprint(text);
    this.#snapshots.set(id, {
      text,
      bytes,
      retainedBytes,
      expiresAt,
      revision,
      tool,
      input: structuredClone(input),
    });
    const uri = resultPageUri(id, 0);
    const deferred = okResult(
      {
        resultResource: {
          uri,
          byteLength: bytes,
          revision,
          expiresAt: new Date(expiresAt).toISOString(),
        },
      },
      "Full outcome is in a paged result. Read it through resources/read or read_result_page before interpreting the operation outcome. Pages expire after five minutes, eviction, or server restart.",
    );
    deferred.structuredContent.status = "deferred";
    return correlateResult(deferred, requestId);
  };

  async read(
    id: string,
    offset: number,
    runtimeFactory: () => Promise<ToolRuntime>,
  ) {
    this.expire();
    const snapshot = this.#snapshots.get(id);
    if (!snapshot) {
      throw new LorError(
        "not_found",
        "Result snapshot expired or is unavailable. Read back current state before retrying a write.",
      );
    }
    if (
      !Number.isSafeInteger(offset) || offset < 0 ||
      offset >= snapshot.text.length ||
      offset % RESULT_PAGE_CHARS !== 0
    ) {
      throw new LorError("invalid_cursor", "Invalid result page offset.");
    }
    let runtime: ToolRuntime | undefined;
    try {
      // These original operations read no private registry state and require no DB.
      if (!PUBLIC_CONTEXT_TOOLS.has(snapshot.tool)) {
        runtime = await runtimeFactory();
        if (!runtime.authorize) {
          throw new LorError(
            "access_denied",
            "Result reads require an authorization hook.",
          );
        }
        await runtime.authorize(snapshot.tool, snapshot.input);
      }
      const next = offset + RESULT_PAGE_CHARS;
      return {
        snapshotId: id,
        offset,
        text: snapshot.text.slice(offset, next),
        totalCharacters: snapshot.text.length,
        byteLength: snapshot.bytes,
        revision: snapshot.revision,
        nextUri: next < snapshot.text.length
          ? resultPageUri(id, next)
          : undefined,
      };
    } finally {
      runtime?.close();
    }
  }

  private expire() {
    for (const [id, snapshot] of this.#snapshots) {
      if (snapshot.expiresAt <= this.now()) this.#snapshots.delete(id);
    }
  }
}

export function resultPageUri(id: string, offset: number) {
  return `lor://results/${id}/${offset}`;
}

export function registerResultPages(
  server: McpServer,
  registerTool: McpServer["registerTool"],
  pages: ResultPages,
  runtimeFactory: () => Promise<ToolRuntime>,
) {
  registerTool("read_result_page", {
    description:
      "Read a retained oversized tool result page on this server. Concatenate text in offset order and parse JSON only after the final page. Does not repeat the original operation.",
    inputSchema: z.strictObject({
      snapshotId: z.uuid(),
      offset: z.number().int().nonnegative().default(0),
    }),
    outputSchema: outputSchemaFor("read_result_page"),
    annotations: toolPolicy("read_result_page"),
  }, async ({ snapshotId, offset }: { snapshotId: string; offset: number }) => {
    try {
      return correlateResult(
        okResult(
          await pages.read(snapshotId, offset, runtimeFactory),
          "Result page.",
        ),
        crypto.randomUUID(),
      );
    } catch (error) {
      const failure = toLorError(error);
      return correlateResult(
        errorResult(failure.code, failure.message),
        crypto.randomUUID(),
      );
    }
  });
  server.registerResource(
    "lor-result-page",
    new ResourceTemplate("lor://results/{snapshotId}/{offset}", {
      list: undefined,
    }),
    {
      mimeType: "application/json",
      description:
        "Short-lived result pages. Same authorization as the original operation.",
    },
    async (uri: URL, variables: Record<string, string | string[]>) => {
      const id = z.uuid().parse(variables.snapshotId);
      const offset = z.string().regex(/^\d+$/).parse(variables.offset);
      return {
        contents: [{
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify(
            await pages.read(id, Number(offset), runtimeFactory),
          ),
        }],
      };
    },
  );
}
