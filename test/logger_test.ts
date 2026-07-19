import { assertEquals, assertStringIncludes } from "@std/assert";
import { createLogger } from "@src/logger.ts";

Deno.test("createLogger emits JSON logs to an injectable destination", () => {
  const destination = new MemoryDestination();
  const logger = createLogger(
    { level: "info", format: "json" },
    { destination },
  );

  logger.info({ safe: "value" }, "hello");

  const log = JSON.parse(destination.output.trim());
  assertEquals(log.name, "lor-mcp");
  assertEquals(log.level, 30);
  assertEquals(log.safe, "value");
  assertEquals(log.msg, "hello");
});

Deno.test("createLogger redacts sensitive fields", () => {
  const destination = new MemoryDestination();
  const logger = createLogger(
    { level: "info", format: "json" },
    { destination },
  );

  logger.info({
    dbPath: "/private/tmp/catalog.db",
    prompt: "secret prompt",
    catalog: { entries: ["secret"] },
    safe: "visible",
  }, "redaction check");

  const output = destination.output.trim();
  assertStringIncludes(output, "visible");
  assertStringIncludes(output, "[redacted]");
  assertEquals(output.includes("/private/tmp/catalog.db"), false);
  assertEquals(output.includes("secret prompt"), false);
  assertEquals(output.includes("secret"), false);
});

Deno.test("createLogger can construct pretty and json modes", () => {
  const destination = new MemoryDestination();

  createLogger({ level: "silent", format: "pretty" });
  createLogger({ level: "silent", format: "json" }, { destination });

  assertEquals(destination.output, "");
});

class MemoryDestination {
  output = "";

  write(chunk: string): void {
    this.output += chunk;
  }
}
