import type {
  CatalogEntry,
  MatchCandidate,
  MatchData,
  MatchRequest,
  MatchResult,
} from "@src/catalog/types.ts";

interface FieldScore {
  field:
    | "primarySpecialty"
    | "specialtyTags"
    | "skillContext.whenToUse"
    | "displayName"
    | "skillContext.examplePrompts"
    | "skillContext.usageNotes"
    | "purpose"
    | "limitedScope"
    | "projectName";
  score: number;
  signals: string[];
}

interface ScoredMatchCandidate extends MatchCandidate {
  fieldScores: FieldScore[];
}

export function findCatalogMatches(
  entries: CatalogEntry[],
  request: MatchRequest,
): MatchResult {
  const taskTokens = tokenize(request.task);
  const hintTokens = request.specialtyHints?.flatMap(tokenize) ?? [];
  const queryTokens = [...taskTokens, ...hintTokens];

  const candidates = entries
    .filter((entry) => entry.verificationStatus === "verified")
    .filter((entry) =>
      request.preferredType ? entry.entryType === request.preferredType : true
    )
    .filter((entry) =>
      request.projectName
        ? normalize(entry.projectName) === normalize(request.projectName)
        : true
    )
    .map((entry) => scoreEntry(entry, queryTokens, request))
    .filter((candidate): candidate is ScoredMatchCandidate =>
      candidate !== undefined
    );

  const agents = rank(
    candidates.filter((entry) => entry.entryType === "agent"),
  );
  const skills = rank(candidates.filter((entry) => entry.entryType === "skill"))
    .slice(0, 5);
  const subagents = rank(
    candidates.filter((entry) => entry.entryType === "subagent"),
  ).slice(0, 3);
  const ambiguousAgents = topAgentsAreAmbiguous(agents, queryTokens);

  const data: MatchData = {
    agents: agents.map(toPublicCandidate),
    skills: skills.map(toPublicCandidate),
    subagents: subagents.map(toPublicCandidate),
    agentsAmbiguous: ambiguousAgents,
  };

  if (ambiguousAgents) {
    const conflictCandidates = nearEqualTopAgents(agents);
    data.conflict = {
      reason: "Multiple agents matched the task with near-equal strength.",
      candidates: conflictCandidates.map(toPublicCandidate),
      matchedSignals: [
        ...new Set(conflictCandidates.flatMap((agent) => agent.matchedSignals)),
      ],
      differentiatingFields: differentiatingFields(conflictCandidates),
      differentiatingSignals: differentiatingSignals(conflictCandidates),
      suggestedClarificationQuestion: suggestedClarificationQuestion(
        conflictCandidates,
      ),
      recommendedNextAction:
        "Ask the user to choose an agent or rerun matching with a more specific projectName or specialtyHints value before preparing a handoff.",
      resolutionHint:
        "Refine the task, add specialty hints, or choose one candidate.",
    };
    return { status: "conflict", data };
  }

  if (agents.length === 0 && skills.length === 0 && subagents.length === 0) {
    return { status: "no_match", data };
  }

  return { status: "ok", data };
}

function scoreEntry(
  entry: CatalogEntry,
  queryTokens: string[],
  request: MatchRequest,
): ScoredMatchCandidate | undefined {
  if (queryTokens.length === 0) {
    return undefined;
  }

  const fieldScores = [
    scoreField("primarySpecialty", entry.primarySpecialty, queryTokens, 10),
    scoreField("specialtyTags", entry.specialtyTags.join(" "), queryTokens, 8),
    ...scoreSkillContext(entry, queryTokens),
    ...scoreSubagentFields(entry, queryTokens),
    scoreField("displayName", entry.displayName, queryTokens, 5),
    request.projectName
      ? undefined
      : scoreField("projectName", entry.projectName, queryTokens, 2),
  ].filter((score): score is FieldScore => score !== undefined);

  const score = fieldScores.reduce((sum, field) => sum + field.score, 0);
  if (score < 3) {
    return undefined;
  }

  const matchedFields = [...new Set(fieldScores.map((field) => field.field))];
  const matchedSignals = [
    ...new Set(fieldScores.flatMap((field) => field.signals)),
  ];
  const confidence = score >= 10 ? "high" : "medium";
  const strongestField = [...fieldScores].sort((a, b) => b.score - a.score)[0]
    ?.field;

  return {
    scope: entry.scope,
    entryType: entry.entryType,
    entryKey: entry.entryKey,
    displayName: entry.displayName,
    projectName: entry.projectName,
    primarySpecialty: entry.primarySpecialty,
    specialtyTags: entry.specialtyTags,
    reachability: entry.entryType === "agent"
      ? {
        reachabilityStatus: entry.reachability.reachabilityStatus,
        dispatchMode: entry.reachability.dispatchMode,
      }
      : undefined,
    skillContext: entry.entryType === "skill" ? entry.skillContext : undefined,
    purpose: entry.entryType === "subagent" ? entry.purpose : undefined,
    limitedScope: entry.entryType === "subagent"
      ? entry.limitedScope
      : undefined,
    prompt: entry.entryType === "subagent" ? entry.prompt : undefined,
    agentReferences: entry.entryType === "subagent"
      ? entry.agentReferences
      : undefined,
    skillReferences: entry.entryType === "subagent"
      ? entry.skillReferences
      : undefined,
    unresolvedReferences: entry.entryType === "subagent"
      ? entry.unresolvedReferences
      : undefined,
    score,
    matchedFields,
    matchedSignals,
    explanation: {
      summary: explanationSummary(entry, strongestField, matchedSignals),
      confidence,
      matchedFields,
      matchedSignals,
      score,
    },
    fieldScores,
  };
}

function explanationSummary(
  entry: CatalogEntry,
  strongestField: FieldScore["field"] | undefined,
  matchedSignals: string[],
): string {
  const entryLabel = `${entry.displayName} (${entry.entryType})`;
  if (!strongestField) {
    return `${entryLabel} matched the task.`;
  }

  const signals = matchedSignals.slice(0, 3);
  const signalText = signals.length > 0 ? ` using ${signals.join(", ")}` : "";

  return `${entryLabel} matched ${fieldLabel(strongestField)}${signalText}.`;
}

function fieldLabel(field: FieldScore["field"]): string {
  switch (field) {
    case "primarySpecialty":
      return "primary specialty";
    case "specialtyTags":
      return "specialty tags";
    case "skillContext.whenToUse":
      return "skill context usage guidance";
    case "displayName":
      return "display name";
    case "skillContext.examplePrompts":
      return "skill context example prompts";
    case "skillContext.usageNotes":
      return "skill context usage notes";
    case "purpose":
      return "subagent purpose";
    case "limitedScope":
      return "subagent limited scope";
    case "projectName":
      return "project name";
  }
}

function scoreSkillContext(
  entry: CatalogEntry,
  queryTokens: string[],
): FieldScore[] {
  if (entry.entryType !== "skill" || !entry.skillContext) {
    return [];
  }

  return [
    entry.skillContext.whenToUse
      ? scoreField(
        "skillContext.whenToUse",
        entry.skillContext.whenToUse,
        queryTokens,
        7,
      )
      : undefined,
    entry.skillContext.examplePrompts
      ? scoreField(
        "skillContext.examplePrompts",
        entry.skillContext.examplePrompts.join(" "),
        queryTokens,
        5,
      )
      : undefined,
    entry.skillContext.usageNotes
      ? scoreField(
        "skillContext.usageNotes",
        entry.skillContext.usageNotes,
        queryTokens,
        3,
      )
      : undefined,
  ].filter((score): score is FieldScore => score !== undefined);
}

function scoreSubagentFields(
  entry: CatalogEntry,
  queryTokens: string[],
): FieldScore[] {
  if (entry.entryType !== "subagent") {
    return [];
  }

  return [
    scoreField("purpose", entry.purpose, queryTokens, 7),
    scoreField("limitedScope", entry.limitedScope, queryTokens, 6),
  ].filter((score): score is FieldScore => score !== undefined);
}

function scoreField(
  field: FieldScore["field"],
  value: string,
  queryTokens: string[],
  weight: number,
): FieldScore | undefined {
  const fieldTokens = tokenize(value);
  let score = 0;
  const signals: string[] = [];

  for (const queryToken of queryTokens) {
    for (const fieldToken of fieldTokens) {
      const tokenScore = scoreToken(queryToken, fieldToken, weight);
      if (tokenScore > 0) {
        score += tokenScore;
        signals.push(queryToken);
        break;
      }
    }
  }

  return score > 0
    ? { field, score, signals: [...new Set(signals)] }
    : undefined;
}

function scoreToken(
  queryToken: string,
  fieldToken: string,
  weight: number,
): number {
  if (queryToken === fieldToken) {
    return weight;
  }
  if (fieldToken.startsWith(queryToken) || queryToken.startsWith(fieldToken)) {
    return Math.max(1, Math.floor(weight * 0.6));
  }
  if (fieldToken.includes(queryToken) || queryToken.includes(fieldToken)) {
    return Math.max(1, Math.floor(weight * 0.4));
  }
  return 0;
}

function rank<T extends MatchCandidate>(candidates: T[]): T[] {
  return candidates.sort((a, b) =>
    b.score - a.score || a.displayName.localeCompare(b.displayName)
  );
}

function topAgentsAreAmbiguous(
  agents: ScoredMatchCandidate[],
  queryTokens: string[],
): boolean {
  const candidates = nearEqualTopAgents(agents);
  return candidates.length > 1 &&
    !hasDeterministicAgentSelection(candidates, queryTokens);
}

function nearEqualTopAgents(
  agents: ScoredMatchCandidate[],
): ScoredMatchCandidate[] {
  const topScore = agents[0]?.score;
  if (!topScore) {
    return [];
  }
  const threshold = topScore * 0.1;
  return agents.filter((agent) => topScore - agent.score <= threshold);
}

function differentiatingFields(
  candidates: ScoredMatchCandidate[],
): string[] {
  const fields = [
    ...new Set(
      candidates.flatMap((candidate) =>
        candidate.fieldScores.map((score) => score.field)
      ),
    ),
  ];
  return fields.filter((field) => {
    const signalSets = candidates.map((candidate) =>
      candidate.fieldScores.find((score) => score.field === field)?.signals ??
        []
    );
    const [first, ...rest] = signalSets.map((signals) =>
      [...signals].sort().join("\u0000")
    );
    return rest.some((signals) => signals !== first);
  });
}

function hasDeterministicAgentSelection(
  candidates: ScoredMatchCandidate[],
  queryTokens: string[],
): boolean {
  return hasExactProjectNameAdvantage(candidates, queryTokens) ||
    hasPrimarySpecialtyAdvantage(candidates);
}

function hasExactProjectNameAdvantage(
  candidates: ScoredMatchCandidate[],
  queryTokens: string[],
): boolean {
  const [topCandidate, ...rest] = candidates;
  if (!topCandidate || !projectNameExactlyMatches(topCandidate, queryTokens)) {
    return false;
  }
  return rest.some((candidate) =>
    !projectNameExactlyMatches(candidate, queryTokens)
  );
}

function projectNameExactlyMatches(
  candidate: ScoredMatchCandidate,
  queryTokens: string[],
): boolean {
  const queryTokenSet = new Set(queryTokens);
  const projectTokens = tokenize(candidate.projectName);
  return projectTokens.length > 0 &&
    projectTokens.every((token) => queryTokenSet.has(token));
}

function hasPrimarySpecialtyAdvantage(
  candidates: ScoredMatchCandidate[],
): boolean {
  const [topCandidate, ...rest] = candidates;
  if (!topCandidate) {
    return false;
  }
  const topScore = fieldScore(topCandidate, "primarySpecialty");
  return topScore > 0 &&
    rest.every((candidate) =>
      topScore > fieldScore(candidate, "primarySpecialty")
    );
}

function fieldScore(
  candidate: ScoredMatchCandidate,
  field: FieldScore["field"],
): number {
  return candidate.fieldScores.find((score) => score.field === field)?.score ??
    0;
}

function differentiatingSignals(
  candidates: ScoredMatchCandidate[],
): string[] {
  const signalCounts = new Map<string, number>();
  for (const candidate of candidates) {
    for (const signal of candidate.matchedSignals) {
      signalCounts.set(signal, (signalCounts.get(signal) ?? 0) + 1);
    }
  }
  return [...signalCounts.entries()]
    .filter(([, count]) => count !== candidates.length)
    .map(([signal]) => signal);
}

function suggestedClarificationQuestion(
  candidates: ScoredMatchCandidate[],
): string {
  const names = candidates.map((candidate) => candidate.displayName);
  return `Which agent should handle this task: ${formatChoiceList(names)}?`;
}

function formatChoiceList(values: string[]): string {
  if (values.length <= 2) {
    return values.join(" or ");
  }
  return `${values.slice(0, -1).join(", ")}, or ${values.at(-1)}`;
}

function toPublicCandidate(
  candidate: ScoredMatchCandidate,
): MatchCandidate {
  const { fieldScores: _fieldScores, ...publicCandidate } = candidate;
  return publicCandidate;
}

function tokenize(value: string): string[] {
  return normalize(value).split(/[^a-z0-9]+/).filter((token) =>
    token.length > 1
  );
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}
