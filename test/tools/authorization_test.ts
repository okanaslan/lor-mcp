import { assertRejects, assertThrows } from "@std/assert";
import {
  type AccessPolicy,
  authorizeOperation,
} from "@src/tools/authorization.ts";
import { loadConfig, loadServeConfig } from "@src/config.ts";

const policy: AccessPolicy = {
  workspaces: ["allowed"],
  globalRead: true,
  globalWrite: false,
  localFiles: false,
  aliases: false,
};
const resolve = (name: string) => name === "alias" ? "denied" : name;

Deno.test("authorization checks workspace aliases, both sync targets and implicit globals", async () => {
  await authorizeOperation(policy, resolve, "list_skills", {
    workspace: "allowed",
  });
  for (
    const [name, input] of [
      ["list_skills", { workspace: "denied" }],
      ["list_skills", { workspace: "alias" }],
      ["apply_workspace_catalog_sync", {
        sourceWorkspace: "allowed",
        targetWorkspace: "denied",
      }],
      ["introduce_skill", { workspace: "allowed" }],
      ["apply_skill_update", { workspace: "allowed", proposalId: "known" }],
      ["apply_skill_file_sync", { workspace: "allowed", confirm: true }],
      ["register_workspace_alias", {
        workspace: "allowed",
        alias: "denied",
        confirm: true,
      }],
    ] as const
  ) {
    await assertRejects(
      () => authorizeOperation(policy, resolve, name, input),
      Error,
      "access_denied",
    );
  }
  await authorizeOperation(policy, resolve, "introduce_skill", {
    workspace: "allowed",
    scope: "workspace",
  });
});

Deno.test("local configuration rejects unsafe exposure and invalid permission flags", () => {
  assertThrows(
    () => loadServeConfig({ LOR_HOST: "0.0.0.0" }),
    Error,
    "loopback",
  );
  assertThrows(
    () => loadConfig({ LOR_GLOBAL_WRITE: "yes" }),
    Error,
    "true or false",
  );
});

Deno.test("local file permission does not grant global catalog reads", async () => {
  const localOnly = { ...policy, localFiles: true, globalRead: false };
  for (const name of ["preview_skill_file_sync", "apply_skill_file_sync"]) {
    await authorizeOperation(localOnly, resolve, name, {
      workspace: "allowed",
      scope: "workspace",
    });
    await assertRejects(
      () =>
        authorizeOperation(localOnly, resolve, name, {
          workspace: "allowed",
          scope: "global",
        }),
      Error,
      "access_denied",
    );
    await assertRejects(
      () =>
        authorizeOperation(localOnly, resolve, name, { workspace: "allowed" }),
      Error,
      "access_denied",
    );
  }
});
