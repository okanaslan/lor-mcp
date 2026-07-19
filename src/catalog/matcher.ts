import type {
  CatalogEntry,
  MatchCandidate,
  MatchData,
  MatchRequest,
  MatchResult,
} from "@src/catalog/types.ts";

interface FieldScore {
  field: "primarySpecialty" | "specialtyTags" | "displayName" | "projectName";
  score: number;
  signals: string[];
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
    .filter((candidate): candidate is MatchCandidate =>
      candidate !== undefined
    );

  const agents = rank(
    candidates.filter((entry) => entry.entryType === "agent"),
  );
  const skills = rank(candidates.filter((entry) => entry.entryType === "skill"))
    .slice(0, 5);
  const ambiguousAgents = topAgentsAreAmbiguous(agents);

  const data: MatchData = {
    agents,
    skills,
    agentsAmbiguous: ambiguousAgents,
  };

  if (ambiguousAgents) {
    const topScore = agents[0]?.score;
    const conflictCandidates = agents.filter((agent) =>
      agent.score === topScore
    );
    data.conflict = {
      reason: "Multiple agents matched the task equally well.",
      candidates: conflictCandidates,
      matchedSignals: [
        ...new Set(conflictCandidates.flatMap((agent) => agent.matchedSignals)),
      ],
      resolutionHint:
        "Refine the task, add specialty hints, or choose one candidate.",
    };
    return { status: "conflict", data };
  }

  if (agents.length === 0 && skills.length === 0) {
    return { status: "no_match", data };
  }

  return { status: "ok", data };
}

function scoreEntry(
  entry: CatalogEntry,
  queryTokens: string[],
  request: MatchRequest,
): MatchCandidate | undefined {
  if (queryTokens.length === 0) {
    return undefined;
  }

  const fieldScores = [
    scoreField("primarySpecialty", entry.primarySpecialty, queryTokens, 10),
    scoreField("specialtyTags", entry.specialtyTags.join(" "), queryTokens, 8),
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
    entryType: entry.entryType,
    entryKey: entry.entryKey,
    displayName: entry.displayName,
    projectName: entry.projectName,
    primarySpecialty: entry.primarySpecialty,
    specialtyTags: entry.specialtyTags,
    skillContext: entry.entryType === "skill" ? entry.skillContext : undefined,
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
    case "displayName":
      return "display name";
    case "projectName":
      return "project name";
  }
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

function rank(candidates: MatchCandidate[]): MatchCandidate[] {
  return candidates.sort((a, b) =>
    b.score - a.score || a.displayName.localeCompare(b.displayName)
  );
}

function topAgentsAreAmbiguous(agents: MatchCandidate[]): boolean {
  return agents.length > 1 && agents[0].score === agents[1].score;
}

function tokenize(value: string): string[] {
  return normalize(value).split(/[^a-z0-9]+/).filter((token) =>
    token.length > 1
  );
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}
