import { LorError } from "@src/errors.ts";
import { assertRevision } from "./revision.ts";
import {
  isDeprecated,
  referenceKey,
  type SkillReference,
  skillReference,
  skillTargets,
} from "./skill_governance.ts";
import type {
  SkillCatalogEntry,
  SkillUpdateProposal,
  SubagentCatalogEntry,
} from "./types.ts";

export function validateSkillGraph(
  candidate: SkillCatalogEntry,
  entries: readonly SkillCatalogEntry[],
  previous?: SkillCatalogEntry,
): void {
  const own = referenceKey(skillReference(candidate));
  const graph = new Map(
    entries.map((e) => [referenceKey(skillReference(e)), e]),
  );
  graph.set(own, candidate);
  const seen = new Set<string>();
  for (
    const relation of candidate.governance?.responsibility?.relationships ?? []
  ) {
    const key = relation.kind + referenceKey(relation.target);
    if (seen.has(key)) {
      throw new LorError("validation_error", "Duplicate skill relationship.");
    }
    seen.add(key);
  }
  for (const target of skillTargets(candidate)) {
    const key = referenceKey(target);
    if (key === own) {
      throw new LorError(
        "validation_error",
        "A skill cannot reference itself.",
      );
    }
    if (
      target.scope === "workspace" &&
      (candidate.scope === "global" || target.workspace !== candidate.workspace)
    ) {
      throw new LorError(
        "validation_error",
        "Skill references must stay within their workspace or point to global scope.",
      );
    }
    if (!graph.has(key)) {
      throw new LorError(
        "validation_error",
        "Referenced skill does not exist.",
        { target },
      );
    }
  }
  const life = candidate.governance?.lifecycle;
  const old = previous?.governance?.lifecycle;
  if (
    life?.status === "deprecated" && life.replacement &&
    !(old?.status === "deprecated" &&
      JSON.stringify(old.replacement) === JSON.stringify(life.replacement))
  ) {
    if (isDeprecated(graph.get(referenceKey(life.replacement))!)) {
      throw new LorError(
        "validation_error",
        "A new replacement must be active.",
      );
    }
  }
  // Separate graphs: complementary/delegation links may be reciprocal.
  for (const kind of ["specializes", "replacement"] as const) {
    const visit = (key: string, path: Set<string>, depth: number): void => {
      if (path.has(key)) {
        throw new LorError("validation_error", `Cyclic ${kind} relationship.`);
      }
      if (depth > 32) {
        throw new LorError(
          "validation_error",
          "Skill relationship chain exceeds 32 hops.",
        );
      }
      const entry = graph.get(key);
      if (!entry) return;
      const state = entry.governance?.lifecycle;
      const targets = kind === "replacement"
        ? (state?.status === "deprecated" && state.replacement
          ? [state.replacement]
          : [])
        : (entry.governance?.responsibility?.relationships.filter((r) =>
          r.kind === "specializes"
        ).map((r) => r.target) ?? []);
      for (const ref of targets) {
        visit(referenceKey(ref), new Set([...path, key]), depth + 1);
      }
    };
    visit(own, new Set(), 0);
  }
}
export function dependencyRevisions(
  entry: SkillCatalogEntry,
  entries: readonly SkillCatalogEntry[],
): NonNullable<SkillUpdateProposal["dependencies"]> {
  const graph = new Map(
    entries.map((e) => [referenceKey(skillReference(e)), e]),
  );
  const found = new Map<string, { target: SkillReference; revision: string }>();
  const own = referenceKey(skillReference(entry));
  const visit = (ref: SkillReference): void => {
    const key = referenceKey(ref);
    if (key === own || found.has(key)) return;
    const target = graph.get(key);
    if (!target?.revision) {
      throw new LorError("validation_error", "Referenced skill is missing.", {
        target: ref,
      });
    }
    found.set(key, { target: ref, revision: target.revision });
    for (const next of skillTargets(target)) visit(next);
  };
  for (const ref of skillTargets(entry)) visit(ref);
  return [...found.values()];
}
export function assertDependencies(
  deps: SkillUpdateProposal["dependencies"],
  entries: readonly SkillCatalogEntry[],
): void {
  const graph = new Map(
    entries.map((e) => [referenceKey(skillReference(e)), e]),
  );
  for (const dep of deps ?? []) {
    assertRevision(graph.get(referenceKey(dep.target))?.revision, dep.revision);
  }
}
export function inboundReferences(
  target: SkillReference,
  skills: readonly SkillCatalogEntry[],
  profiles: readonly SubagentCatalogEntry[],
) {
  const key = referenceKey(target);
  const refs: {
    entryType: string;
    scope: string;
    workspace: string;
    entryKey: string;
    kind: string;
  }[] = [];
  for (const skill of skills) {
    if (skillTargets(skill).some((r) => referenceKey(r) === key)) {
      refs.push({
        entryType: "skill",
        scope: skill.scope,
        workspace: skill.workspace,
        entryKey: skill.skillName,
        kind: "relationship-or-replacement",
      });
    }
  }
  for (const profile of profiles) {
    const matches = [
      ...profile.skillReferences,
      ...profile.unresolvedReferences,
    ].some((r) =>
      r.entryType === "skill" && (r.entryKey ?? r.name) === target.skillName &&
      (r.scope === undefined || r.scope === target.scope) &&
      (target.scope === "global" || profile.workspace === target.workspace)
    );
    if (matches) {
      refs.push({
        entryType: "subagent",
        scope: profile.scope,
        workspace: profile.workspace,
        entryKey: profile.entryKey,
        kind: "skill-reference",
      });
    }
  }
  return refs;
}
