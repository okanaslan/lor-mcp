import { assert, assertEquals, assertThrows } from "@std/assert";
import {
  agentPromptRoles,
  generateAgentPrompt,
} from "@src/agent_prompts/generator.ts";
import { AgenticRouterError } from "@src/errors.ts";

for (const role of agentPromptRoles) {
  Deno.test(`generateAgentPrompt renders ${role} preset`, () => {
    const result = generateAgentPrompt({
      workspace: "Agentic-Router",
      role,
    });

    assertEquals(result.workspace, "Agentic-Router");
    assertEquals(result.role, role);
    assert(result.prompt.length > 0);
    assert(result.displayName.length > 0);
    assertEquals(
      result.suggestedAgentMetadata.projectName,
      "Agentic-Router",
    );
    assertEquals(
      result.suggestedAgentMetadata.displayName,
      result.displayName,
    );
    assert(result.suggestedAgentMetadata.primarySpecialty.length > 0);
    assert(result.suggestedAgentMetadata.specialtyTags.length > 0);
    assert(!("codexSessionId" in result.suggestedAgentMetadata));
    assert(result.suggestedAgentMetadata.handoff);
    assert(
      result.prompt.includes("Read repo instructions before changing files."),
    );
    assert(
      result.prompt.includes(
        "Respect planning-only, review-only, and learn-first tasks.",
      ),
    );
    assert(result.prompt.includes("Keep changes scoped to the request."));
    assert(
      result.prompt.includes(
        "Preserve user and other-agent work; do not revert unrelated changes.",
      ),
    );
    assert(
      result.prompt.includes("Report exact verification commands and results."),
    );
  });
}

Deno.test("generateAgentPrompt renders optional project task context and constraints", () => {
  const result = generateAgentPrompt({
    workspace: "Agentic-Router",
    role: "backend",
    projectName: "Agentic Router",
    task: "Add a tool",
    context: "Follow existing MCP handler patterns",
    constraints: "Do not add storage writes",
  });

  assertEquals(
    result.suggestedAgentMetadata.projectName,
    "Agentic Router",
  );
  assert(result.prompt.includes("for Agentic Router"));
  assert(result.prompt.includes("Initial task:\nAdd a tool"));
  assert(
    result.prompt.includes(
      "Context:\nFollow existing MCP handler patterns",
    ),
  );
  assert(
    result.prompt.includes("User constraints:\nDo not add storage writes"),
  );
});

Deno.test("generateAgentPrompt trims input values", () => {
  const result = generateAgentPrompt({
    workspace: " Agentic-Router ",
    role: " backend ",
    projectName: " Agentic Router ",
    task: " Add a tool ",
    context: " Follow existing patterns ",
    constraints: " Stay scoped ",
  });

  assertEquals(result.workspace, "Agentic-Router");
  assertEquals(result.role, "backend");
  assertEquals(
    result.suggestedAgentMetadata.projectName,
    "Agentic Router",
  );
  assert(result.prompt.includes("Initial task:\nAdd a tool"));
  assert(result.prompt.includes("Context:\nFollow existing patterns"));
  assert(result.prompt.includes("User constraints:\nStay scoped"));
});

Deno.test("generateAgentPrompt validates required fields and supported roles", () => {
  const missingWorkspace = assertThrows(
    () => generateAgentPrompt({ workspace: " ", role: "backend" }),
    AgenticRouterError,
    "workspace is required",
  );
  assertEquals(missingWorkspace.code, "validation_error");

  const missingRole = assertThrows(
    () => generateAgentPrompt({ workspace: "Agentic-Router", role: " " }),
    AgenticRouterError,
    "role is required",
  );
  assertEquals(missingRole.code, "validation_error");

  const unknownRole = assertThrows(
    () => generateAgentPrompt({ workspace: "Agentic-Router", role: "sales" }),
    AgenticRouterError,
    "role must be one of the supported role presets",
  );
  assertEquals(unknownRole.code, "validation_error");
  assertEquals(unknownRole.details, {
    field: "role",
    supportedRoles: agentPromptRoles.join(", "),
  });
});
