# Registration And Updates

Read the current LOR tool schemas. The operation mapping in the bundled release
is:

| Intent                                         | Tool                                               |
| ---------------------------------------------- | -------------------------------------------------- |
| Inspect visible entries                        | `list_skills`, `find_matching_skill`               |
| Inspect one canonical entry                    | `get_skill_detail` with explicit scope             |
| Register a new entry                           | `introduce_skill`                                  |
| Change editable metadata/routing               | `update_skill`                                     |
| Change stored skill instructions               | `propose_skill_update`, then `apply_skill_update`  |
| Preview or synchronize a managed local section | `preview_skill_file_sync`, `apply_skill_file_sync` |

LOR's existing local section-sync tools operate on the server's configured skill
roots. They do not install a whole skill onto a remote client's machine. Bundled
default resources and the local installer are separate from catalog
registration.

Before creating an entry, inspect likely duplicates by name and purpose. Update
the existing canonical entry when it represents the same workflow and the user
authorized the update. Do not silently replace a different skill that happens to
share its name. An unchanged registration is a no-op; no timestamp-only update
is needed. If a create races with another create, read the conflicting entry
before deciding whether anything remains to do.

Before updating, preserve all fields outside the requested change. Do not assume
nested objects are deep-merged: carry forward existing routing fields when merge
behavior is unknown, and inspect the proposal's before/after data. Changing a
display name or adding an alias does not rename an immutable entry key.

For an instruction update, explain the proposal's actual change and follow the
tool's confirmation contract. Read the latest entry again if the proposal
becomes stale. Never approve a different payload under an earlier confirmation.

If local source and registered context disagree, identify which source the user
intends to update. Report drift; do not overwrite both automatically.
Registering an entry does not prove the skill is installed or discoverable by
every client.
