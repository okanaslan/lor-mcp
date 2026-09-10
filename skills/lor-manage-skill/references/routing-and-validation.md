# Routing And Validation

Derive structured routing from the workflow's actual purpose. Supply precise
intents, domains, positive keywords, aliases, and expected outputs supported by
the current schema. Avoid generic standalone terms such as `plan`, `create`, and
`improve` as decisive signals. Do not copy the raw user prompt into every field.

For this skill, useful intents are `register_lor_skill`, `create_lor_skill`, and
`update_lor_skill`, with domain `lor` and discovery aliases `lor-add-skill` and
`lor-update-skill`. These are suggested routing values, not additional MCP
methods.

Use exclusions only to distinguish likely competing workflows. Broad negative
keywords can suppress valid requests containing the name of the skill being
registered, such as "register a deployment skill". Do not mark `deployment` as a
negative solely because this skill does not itself deploy anything. Inspect
debug signals and judge relevance rather than trusting confidence labels.

Evaluate positive, neighboring, and negative requests. Examples for this
package:

| Request                                              | Expected behavior                                                   |
| ---------------------------------------------------- | ------------------------------------------------------------------- |
| Register this existing skill in LOR.                 | Inspect source, check duplicates, register and verify.              |
| Make this established workflow a reusable LOR skill. | Author instructions and registration metadata.                      |
| Improve this registered skill's instructions.        | Retrieve and update the existing entry.                             |
| Register this same unchanged skill again.            | No unnecessary write.                                               |
| Register a deployment skill.                         | Manage the skill without deploying.                                 |
| Give me a plan to register this skill.               | No mutation.                                                        |
| Save this decision as a workspace note.              | Outside this skill's responsibility.                                |
| Run the deployment skill.                            | Execute through the appropriate workflow, not registry maintenance. |

Test explicit canonical-name retrieval independently of fuzzy matching. Read
back the saved entry and confirm unrelated metadata survived. A successful
schema check does not prove instructions work; evaluate behavior on
representative tasks and state which checks actually ran. Use a disposable
catalog for mutation examples.
