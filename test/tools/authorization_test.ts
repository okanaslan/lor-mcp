import { assertThrows } from "@std/assert";
import {
  type AccessPolicy,
  authorizeOperation,
} from "@src/tools/authorization.ts";
import { loadConfig, loadServeConfig } from "@src/config.ts";

const policy: AccessPolicy = {
  globalRead: true,
  globalWrite: false,
  localFiles: false,
  aliases: false,
};

Deno.test("authorization accepts any workspace and sync targets without configuration", () => {
  for (const workspace of ["new-project", "/arbitrary/project", "alias"]) {
    authorizeOperation(policy, "list_skills", { workspace });
    authorizeOperation(policy, "introduce_skill", {
      workspace,
      scope: "workspace",
    });
    authorizeOperation(policy, "remember_workspace_note", { workspace });
  }
  authorizeOperation(policy, "apply_workspace_catalog_sync", {
    sourceWorkspace: "/project-a",
    targetWorkspace: "/project-b",
  });
});

Deno.test("authorization retains implicit global, file-sync and alias restrictions", () => {
  for (
    const [name, input] of [
      ["introduce_skill", { workspace: "new-project" }],
      ["introduce_skill", { workspace: "new-project", scope: "global" }],
      ["apply_skill_update", { workspace: "new-project", proposalId: "known" }],
      ["apply_skill_file_sync", {
        workspace: "new-project",
        scope: "workspace",
      }],
      ["preview_skill_file_sync", {
        workspace: "new-project",
        scope: "workspace",
      }],
      ["register_workspace_alias", {
        workspace: "new-project",
        alias: "alias",
      }],
    ] as const
  ) {
    assertThrows(
      () => authorizeOperation(policy, name, input),
      Error,
      "access_denied",
    );
  }
  authorizeOperation({ ...policy, aliases: true }, "register_workspace_alias", {
    workspace: "/new-project",
    alias: "new-alias",
  });
  authorizeOperation({ ...policy, globalWrite: true }, "introduce_skill", {
    workspace: "/new-project",
    scope: "global",
  });
  assertThrows(
    () => authorizeOperation(policy, "list_skills", null),
    Error,
    "access_denied",
  );
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

Deno.test("workspace access does not grant global reads or local file permissions", () => {
  const localOnly = { ...policy, localFiles: true, globalRead: false };
  authorizeOperation(localOnly, "list_skills", {
    workspace: "/new-project",
    scope: "workspace",
  });
  for (const scope of ["global", undefined]) {
    assertThrows(
      () =>
        authorizeOperation(localOnly, "list_skills", {
          workspace: "/new-project",
          scope,
        }),
      Error,
      "access_denied",
    );
  }
  for (const name of ["preview_skill_file_sync", "apply_skill_file_sync"]) {
    authorizeOperation(localOnly, name, {
      workspace: "/new-project",
      scope: "workspace",
    });
    for (const scope of ["global", undefined]) {
      assertThrows(
        () =>
          authorizeOperation(localOnly, name, {
            workspace: "/new-project",
            scope,
          }),
        Error,
        "access_denied",
      );
    }
  }
});
