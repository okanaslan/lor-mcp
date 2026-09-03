import type {
  CatalogEntry,
  ExcludedMatchCandidate,
  MatchCandidate,
  MatchData,
  MatchRequest,
  MatchResult,
  MatchSignal,
  RoutingMetadata,
  RoutingSignalSource,
  SkillContext,
} from "@src/catalog/types.ts";

interface QuerySignal {
  term: string;
  termKind: "alias" | "phrase" | "token";
  source:
    | RoutingSignalSource
    | "task"
    | "specialtyHints"
    | "negativeKeywords";
}

interface NormalizedQuery {
  positiveSignals: QuerySignal[];
  positiveTerms: string[];
  positiveTermSet: Set<string>;
  negativeSignals: QuerySignal[];
  negativeTerms: string[];
  intentTerms: string[];
  excludedSkillTerms: string[];
  preferredSkillTerms: string[];
  ignoredSignals: string[];
  hasStructuredSignals: boolean;
}

interface FieldScore {
  field: string;
  source: RoutingSignalSource | string;
  score: number;
  signals: string[];
  signalBreakdown: MatchSignal[];
}

interface NegativeScore {
  fields: string[];
  score: number;
  signals: string[];
  signalBreakdown: MatchSignal[];
}

interface ScoredMatchCandidate extends MatchCandidate {
  fieldScores: FieldScore[];
}

interface ExcludedCandidate extends ExcludedMatchCandidate {
  score?: number;
}

type ScoreResult = ScoredMatchCandidate | ExcludedCandidate | undefined;

const STRONG_NEGATIVE_SCORE = 10;
const MINIMUM_SCORE = 3;
const PREFERRED_SKILL_BOOST = 20;

const DEFAULT_FIELD_WEIGHTS: Record<string, number> = {
  entryKey: 30,
  skillName: 30,
  subagentName: 30,
  displayNameExact: 24,
  "routing.intents": 25,
  "routing.requiredAll": 18,
  "routing.requiredAny": 16,
  specialtyTags: 8,
  "routing.positiveKeywords": 12,
  "routing.domain": 10,
  "routing.outputNeed": 10,
  intent: 25,
  requiredAll: 18,
  requiredAny: 16,
  positiveKeywords: 12,
  domain: 10,
  outputNeed: 10,
  negativeKeywords: 10,
  primarySpecialty: 10,
  purpose: 7,
  "skillContext.whenToUse": 7,
  limitedScope: 6,
  displayName: 5,
  "skillContext.examplePrompts": 5,
  "skillContext.usageNotes": 3,
  projectName: 2,
};

const ROUTING_FIELD_SOURCES: Record<
  keyof Omit<
    RoutingMetadata,
    | "excludedIntents"
    | "negativeKeywords"
    | "softNegativeExamples"
    | "fieldWeights"
  >,
  RoutingSignalSource
> = {
  intents: "intent",
  positiveKeywords: "positiveKeywords",
  requiredAny: "requiredAny",
  requiredAll: "requiredAll",
  domain: "domain",
  outputNeed: "outputNeed",
};

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "has",
  "have",
  "in",
  "is",
  "it",
  "of",
  "on",
  "or",
  "request",
  "that",
  "the",
  "this",
  "to",
  "use",
  "when",
  "with",
]);

const NEGATIVE_ROUTING_GENERIC_TERMS = new Set([
  "actionable",
  "already",
  "branch",
  "comment",
  "comment-validity",
  "comments",
  "existing",
  "existing-feedback",
  "existing-review-comments",
  "feedback",
  "fix",
  "github-pr",
  "issue",
  "pr-comments",
  "pr-feedback",
  "pull",
  "pull-request",
  "pull-request-comments",
  "pull-request-feedback",
  "push",
  "review",
  "reviewer",
  "reviewer-comment",
  "reviewer-feedback",
  "unresolved-review-threads",
  "valid",
]);

const LOW_VALUE_TOKEN_TERMS = new Set([
  "active",
  "branch",
  "check",
  "comment",
  "comments",
  "current",
  "feedback",
  "fix",
  "issue",
  "list",
  "pull",
  "push",
  "review",
  "reviewer",
  "valid",
]);

const ALIASES: ReadonlyArray<[RegExp, string]> = [
  [/\bpr\s+feedback\s+evaluator\b/g, "pr-feedback-evaluator"],
  [/\bpr\s+feedback\b/g, "pr-feedback"],
  [/\bpr\s+comments?\b/g, "pr-comments"],
  [/\bpull\s+request\s+feedback\b/g, "pr-feedback"],
  [/\bpull\s+request\s+comments?\b/g, "pr-comments"],
  [/\bgithub\s+pr\b/g, "github-pr"],
  [/\bgithub\s+pull\s+request\b/g, "github-pr"],
  [/\breview\s+threads?\b/g, "reviewer-thread"],
  [/\breview\s+comments?\b/g, "reviewer-comment"],
  [/\breviewer\s+feedback\b/g, "reviewer-feedback"],
  [/\breviewer'?s\s+feedback\b/g, "reviewer-feedback"],
  [/\breviewer\s+comments?\b/g, "reviewer-comment"],
  [/\breceived\s+pr\s+feedback\b/g, "received-feedback"],
  [/\breceived\s+feedback\b/g, "received-feedback"],
  [/\bexisting\s+feedback\b/g, "existing-feedback"],
  [/\bexisting\s+review\s+comments?\b/g, "existing-review-comments"],
  [/\bunresolved\s+review\s+threads?\b/g, "unresolved-review-threads"],
  [/\bunresolved\s+pr\s+comments?\b/g, "unresolved-review-threads"],
  [/\bunresolved\s+threads?\b/g, "unresolved-review-threads"],
  [/\bstill\s+valid\b/g, "still-valid comment-validity"],
  [/\balready\s+fixed\b/g, "already-fixed"],
  [/\bhow\s+to\s+fix\b/g, "how-to-fix"],
  [/\bease\s+of\s+fix\b/g, "ease-of-fix"],
  [/\bissue\s+impact\b/g, "issue-impact"],
  [/\bfix\s+or\s+defer\b/g, "fix-or-defer"],
  [/\bactionable\s+feedback\b/g, "actionable-feedback"],
  [/\bfresh\s+review\b/g, "fresh-review"],
  [/\bcode\s+review\b/g, "review-code"],
  [/\bpr\b/g, "pull-request"],
  [/\bpull\s+request\b/g, "pull-request"],
];

export function findCatalogMatches(
  entries: CatalogEntry[],
  request: MatchRequest,
): MatchResult {
  const query = normalizeQuery(request);
  const excludedCandidates: ExcludedCandidate[] = [];
  const candidates: ScoredMatchCandidate[] = [];

  for (const entry of entries) {
    const hardExclusion = hardFilterEntry(entry, request, query);
    if (hardExclusion) {
      if (request.debug) {
        excludedCandidates.push(toExcludedCandidate(entry, hardExclusion));
      }
      continue;
    }

    const scored = scoreEntry(entry, query, request);
    if (!scored) {
      continue;
    }
    if ("excludedBy" in scored) {
      if (request.debug) {
        excludedCandidates.push(scored);
      }
      continue;
    }
    candidates.push(scored);
  }

  const reroutedCandidates = applyInsteadUseRerouting(candidates);
  if (request.debug) {
    excludedCandidates.push(...reroutedCandidates.excluded);
  }
  const routableCandidates = reroutedCandidates.candidates;

  const agents = rank(
    routableCandidates.filter((entry) => entry.entryType === "agent"),
  );
  const skills = rank(
    routableCandidates.filter((entry) => entry.entryType === "skill"),
  ).slice(0, 5);
  const subagents = rank(
    routableCandidates.filter((entry) => entry.entryType === "subagent"),
  ).slice(0, 3);
  const ambiguousAgents = topAgentsAreAmbiguous(agents, query.positiveTerms);

  const data: MatchData = {
    agents: agents.map(toPublicCandidate),
    skills: skills.map(toPublicCandidate),
    subagents: subagents.map(toPublicCandidate),
    agentsAmbiguous: ambiguousAgents,
  };

  if (request.debug) {
    data.querySignals = query.positiveTerms;
    data.ignoredSignals = query.ignoredSignals;
    data.excludedCandidates = excludedCandidates.map(stripExcludedScore);
  }

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

function hardFilterEntry(
  entry: CatalogEntry,
  request: MatchRequest,
  query: NormalizedQuery,
): { reasons: string[]; negativeSignals?: MatchSignal[] } | undefined {
  const reasons: string[] = [];
  const negativeSignals: MatchSignal[] = [];

  if (entry.verificationStatus !== "verified") {
    reasons.push("verificationStatus");
  }
  if (request.preferredType && entry.entryType !== request.preferredType) {
    reasons.push("preferredType");
  }
  if (
    request.projectName &&
    normalizeForComparison(entry.projectName) !==
      normalizeForComparison(request.projectName)
  ) {
    reasons.push("projectName");
  }
  if (
    (entry.entryType === "skill" || entry.entryType === "subagent") &&
    identifierTerms(entry).some((term) =>
      query.excludedSkillTerms.includes(term)
    )
  ) {
    reasons.push("excludedSkills");
  }

  const routing = entryRouting(entry);
  if (routing) {
    const excludedIntentMatches = matchValues(
      routing.excludedIntents,
      query.intentTerms,
    );
    if (excludedIntentMatches.length > 0) {
      reasons.push("routing.excludedIntents");
      negativeSignals.push(...toSignals(excludedIntentMatches, "intent", 100));
    }

    if (
      missingRequiredValues(routing.requiredAll, query.positiveTermSet).length
    ) {
      reasons.push("routing.requiredAll");
    }

    if (
      missingRequiredAnyValue(routing.requiredAny, query.positiveTermSet).length
    ) {
      reasons.push("routing.requiredAny");
    }

    const negativeKeywordMatches = strictNegativeMatches(
      positiveRoutingValues(entry),
      query.negativeTerms,
    );
    if (negativeKeywordMatches.length > 0) {
      reasons.push("request.negativeKeywords");
      negativeSignals.push(
        ...toSignals(negativeKeywordMatches, "negativeKeywords", 100),
      );
    }
  }

  return reasons.length > 0 ? { reasons, negativeSignals } : undefined;
}

function scoreEntry(
  entry: CatalogEntry,
  query: NormalizedQuery,
  request: MatchRequest,
): ScoreResult {
  if (query.positiveSignals.length === 0) {
    return undefined;
  }
  const routing = entryRouting(entry);

  const fieldScores = [
    ...scoreRoutingFields(entry, query),
    ...scoreIdentityFields(entry, query),
    scoreField(
      "primarySpecialty",
      "primarySpecialty",
      entry.primarySpecialty,
      query.positiveSignals,
      fieldWeight(routing, "primarySpecialty"),
    ),
    scoreField(
      "specialtyTags",
      "specialtyTags",
      entry.specialtyTags.join(" "),
      query.positiveSignals,
      fieldWeight(routing, "specialtyTags"),
    ),
    ...scoreSkillContext(entry, query),
    ...scoreSubagentFields(entry, query),
    scoreField(
      "displayName",
      "displayName",
      entry.displayName,
      query.positiveSignals,
      fieldWeight(routing, "displayName"),
    ),
    request.projectName ? undefined : scoreField(
      "projectName",
      "projectName",
      entry.projectName,
      query.positiveSignals,
      fieldWeight(routing, "projectName"),
    ),
  ].filter((score): score is FieldScore => score !== undefined);

  const positiveScore = fieldScores.reduce(
    (sum, field) => sum + field.score,
    0,
  );
  if (positiveScore < MINIMUM_SCORE) {
    return undefined;
  }

  const combinedNegative = combineNegativeScores([
    scoreNegativeRouting(entry, query.positiveSignals),
    scoreStructuredNegativeRouting(entry, query.positiveSignals),
    scoreRequestNegativeAgainstEntry(entry, query),
  ]);
  if (combinedNegative && combinedNegative.score >= STRONG_NEGATIVE_SCORE) {
    return toExcludedCandidate(entry, {
      reasons: ["negativeRouting"],
      negativeSignals: combinedNegative.signalBreakdown,
    });
  }

  const preferenceBoost = preferredSkillBoost(entry, query);
  const adjustedScore = Math.max(
    0,
    positiveScore + preferenceBoost - (combinedNegative?.score ?? 0),
  );
  if (adjustedScore < MINIMUM_SCORE) {
    return undefined;
  }

  const matchedFields = [...new Set(fieldScores.map((field) => field.field))];
  const matchedSignals = uniqueMatchedSignalStrings(
    fieldScores.flatMap((field) => field.signals),
  );
  const confidence = adjustedScore >= 10 ? "high" : "medium";
  const strongestField = [...fieldScores].sort((a, b) => b.score - a.score)[0]
    ?.field;
  const summarySignals = summaryMatchedSignals(fieldScores);
  const explanation: MatchCandidate["explanation"] = {
    summary: explanationSummary(entry, strongestField, summarySignals),
    confidence,
    matchedFields,
    matchedSignals,
    score: adjustedScore,
  };
  if (combinedNegative) {
    explanation.negativeMatchedFields = combinedNegative.fields;
    explanation.negativeMatchedSignals = combinedNegative.signals;
    explanation.negativeScore = combinedNegative.score;
    explanation.demotedByNegativeRouting = true;
  }
  if (request.debug) {
    explanation.signalBreakdown = fieldScores.flatMap((field) =>
      field.signalBreakdown
    );
    explanation.ignoredSignals = query.ignoredSignals;
    explanation.negativeSignals = combinedNegative?.signalBreakdown ?? [];
    explanation.finalScoreBreakdown = {
      positive: positiveBreakdown(fieldScores),
      negativePenalty: combinedNegative?.score ?? 0,
      preferenceBoost,
      finalScore: adjustedScore,
    };
  }

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
    skillContext: entry.entryType === "skill"
      ? compactSkillContext(entry.skillContext)
      : undefined,
    negativeRouting: entry.entryType === "skill"
      ? entry.skillContext?.negativeRouting ?? undefined
      : entry.entryType === "subagent"
      ? entry.negativeRouting
      : undefined,
    routing,
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
    score: adjustedScore,
    matchedFields,
    matchedSignals,
    explanation,
    fieldScores,
  };
}

function compactSkillContext(
  skillContext: SkillContext | undefined,
): SkillContext | undefined {
  if (!skillContext) {
    return undefined;
  }
  const { implementationGuidance: _implementationGuidance, ...compact } =
    skillContext;
  return Object.keys(compact).length > 0 ? compact : undefined;
}

function applyInsteadUseRerouting(
  candidates: ScoredMatchCandidate[],
): { candidates: ScoredMatchCandidate[]; excluded: ExcludedCandidate[] } {
  const excludedKeys = new Set<string>();
  const excluded: ExcludedCandidate[] = [];

  for (const candidate of candidates) {
    if (!candidate.explanation.demotedByNegativeRouting) {
      continue;
    }
    if (hasExplicitIdentityMatch(candidate)) {
      continue;
    }
    const insteadUseTerms = normalizeTerms(
      candidate.negativeRouting?.insteadUse,
    )
      .terms
      .filter((term) => term.includes("-"));
    if (insteadUseTerms.length === 0) {
      continue;
    }

    const target = candidates.find((other) =>
      other.entryKey !== candidate.entryKey &&
      candidateIdentifierTerms(other).some((term) =>
        insteadUseTerms.includes(term)
      )
    );
    if (!target) {
      continue;
    }

    excludedKeys.add(candidate.entryKey);
    excluded.push({
      scope: candidate.scope,
      entryType: candidate.entryType,
      entryKey: candidate.entryKey,
      displayName: candidate.displayName,
      projectName: candidate.projectName,
      primarySpecialty: candidate.primarySpecialty,
      specialtyTags: candidate.specialtyTags,
      excludedBy: ["negativeRouting.insteadUse"],
      matchedSignals: candidate.matchedSignals,
      negativeSignals: candidate.explanation.negativeSignals ?? [],
      score: candidate.score,
    });
  }

  return {
    candidates: candidates.filter((candidate) =>
      !excludedKeys.has(candidate.entryKey)
    ),
    excluded,
  };
}

function hasExplicitIdentityMatch(candidate: ScoredMatchCandidate): boolean {
  return candidate.fieldScores.some((fieldScore) =>
    ["entryKey", "skillName", "subagentName", "displayName"].includes(
      fieldScore.field,
    ) &&
    fieldScore.signalBreakdown.some((signal) =>
      signal.querySource === "task" &&
      (signal.matchKind === "alias" || signal.matchKind === "phrase") &&
      signal.queryTerm === signal.candidateTerm
    )
  );
}

function candidateIdentifierTerms(candidate: MatchCandidate): string[] {
  const identifiers = [candidate.entryKey, candidate.displayName];
  if (candidate.entryType === "skill") {
    identifiers.push(candidate.entryKey);
  }
  if (candidate.entryType === "subagent") {
    identifiers.push(candidate.entryKey);
  }
  return [
    ...new Set(
      identifiers.flatMap((identifier) => normalizeIdentityTerms(identifier)),
    ),
  ];
}

function scoreIdentityFields(
  entry: CatalogEntry,
  query: NormalizedQuery,
): FieldScore[] {
  const routing = entryRouting(entry);
  const scores: Array<FieldScore | undefined> = [
    scoreIdentityField(
      "entryKey",
      "entryKey",
      entry.entryKey,
      query.positiveSignals,
      fieldWeight(routing, "entryKey"),
    ),
    scoreIdentityField(
      "displayName",
      "displayName",
      entry.displayName,
      query.positiveSignals,
      fieldWeight(routing, "displayNameExact"),
    ),
  ];
  if (entry.entryType === "skill") {
    scores.push(
      scoreIdentityField(
        "skillName",
        "skillName",
        entry.skillName,
        query.positiveSignals,
        fieldWeight(routing, "skillName"),
      ),
    );
    return scores.filter((score): score is FieldScore => score !== undefined);
  }
  if (entry.entryType === "subagent") {
    scores.push(
      scoreIdentityField(
        "subagentName",
        "subagentName",
        entry.name,
        query.positiveSignals,
        fieldWeight(routing, "subagentName"),
      ),
    );
    return scores.filter((score): score is FieldScore => score !== undefined);
  }
  return scores.filter((score): score is FieldScore => score !== undefined);
}

function scoreIdentityField(
  field: string,
  source: string,
  value: string,
  querySignals: QuerySignal[],
  weight: number,
): FieldScore | undefined {
  const fieldTerms = normalizeIdentityTerms(value);
  const identitySignals = querySignals.filter((signal) =>
    signal.term.includes("-")
  );
  return scoreFieldTerms(
    field,
    source,
    fieldTerms,
    identitySignals,
    weight,
    { allowPrefix: false },
  );
}

function scoreRoutingFields(
  entry: CatalogEntry,
  query: NormalizedQuery,
): FieldScore[] {
  const routing = entryRouting(entry);
  if (!routing) {
    return [];
  }

  const scores: Array<FieldScore | undefined> = [];
  for (
    const [key, source] of Object.entries(ROUTING_FIELD_SOURCES) as Array<
      [keyof typeof ROUTING_FIELD_SOURCES, RoutingSignalSource]
    >
  ) {
    scores.push(scoreField(
      `routing.${key}`,
      source,
      routing[key]?.join(" ") ?? "",
      query.positiveSignals,
      fieldWeight(routing, source),
    ));
  }
  return scores.filter((score): score is FieldScore => score !== undefined);
}

function scoreSkillContext(
  entry: CatalogEntry,
  query: NormalizedQuery,
): FieldScore[] {
  if (entry.entryType !== "skill" || !entry.skillContext) {
    return [];
  }

  return [
    entry.skillContext.whenToUse
      ? scoreField(
        "skillContext.whenToUse",
        "skillContext.whenToUse",
        entry.skillContext.whenToUse,
        query.positiveSignals,
        fieldWeight(entry.routing, "skillContext.whenToUse"),
      )
      : undefined,
    entry.skillContext.examplePrompts
      ? scoreField(
        "skillContext.examplePrompts",
        "skillContext.examplePrompts",
        entry.skillContext.examplePrompts.join(" "),
        query.positiveSignals,
        fieldWeight(entry.routing, "skillContext.examplePrompts"),
      )
      : undefined,
    entry.skillContext.usageNotes
      ? scoreField(
        "skillContext.usageNotes",
        "skillContext.usageNotes",
        entry.skillContext.usageNotes,
        query.positiveSignals,
        fieldWeight(entry.routing, "skillContext.usageNotes"),
      )
      : undefined,
  ].filter((score): score is FieldScore => score !== undefined);
}

function scoreSubagentFields(
  entry: CatalogEntry,
  query: NormalizedQuery,
): FieldScore[] {
  if (entry.entryType !== "subagent") {
    return [];
  }

  return [
    scoreField(
      "purpose",
      "purpose",
      entry.purpose,
      query.positiveSignals,
      fieldWeight(entry.routing, "purpose"),
    ),
    scoreField(
      "limitedScope",
      "limitedScope",
      entry.limitedScope,
      query.positiveSignals,
      fieldWeight(entry.routing, "limitedScope"),
    ),
  ].filter((score): score is FieldScore => score !== undefined);
}

function scoreField(
  field: string,
  source: RoutingSignalSource | string,
  value: string,
  querySignals: QuerySignal[],
  weight: number,
): FieldScore | undefined {
  return scoreFieldTerms(
    field,
    source,
    normalizeTerms([value]).terms,
    querySignals,
    weight,
  );
}

function scoreFieldTerms(
  field: string,
  source: RoutingSignalSource | string,
  fieldTerms: readonly string[],
  querySignals: QuerySignal[],
  weight: number,
  options: { allowPrefix?: boolean } = {},
): FieldScore | undefined {
  let score = 0;
  const signals: string[] = [];
  const signalBreakdown: MatchSignal[] = [];

  for (const querySignal of querySignals) {
    let bestMatch:
      | {
        term: string;
        score: number;
        matchKind: MatchSignal["matchKind"];
      }
      | undefined;
    for (const fieldTerm of fieldTerms) {
      const tokenScore = scoreToken(
        querySignal.term,
        fieldTerm,
        weight,
        options.allowPrefix ?? true,
      );
      if (tokenScore > 0) {
        const matchKind = resolveMatchKind(querySignal, fieldTerm, source);
        if (
          !bestMatch ||
          tokenScore > bestMatch.score ||
          (tokenScore === bestMatch.score &&
            fieldTerm.length > bestMatch.term.length)
        ) {
          bestMatch = { term: fieldTerm, score: tokenScore, matchKind };
        }
      }
    }
    if (!bestMatch) {
      continue;
    }
    score += bestMatch.score;
    signals.push(
      formatMatchedSignal(
        querySignal,
        source,
        bestMatch.term,
        bestMatch.matchKind,
      ),
    );
    signalBreakdown.push({
      term: bestMatch.term,
      source,
      weight: bestMatch.score,
      queryTerm: querySignal.term,
      querySource: querySignal.source,
      candidateTerm: bestMatch.term,
      candidateSource: source,
      matchKind: bestMatch.matchKind,
    });
  }

  return score > 0
    ? {
      field,
      source,
      score,
      signals: [...new Set(signals)],
      signalBreakdown: uniqueSignals(signalBreakdown),
    }
    : undefined;
}

function scoreToken(
  queryToken: string,
  fieldToken: string,
  weight: number,
  allowPrefix = true,
): number {
  if (queryToken === fieldToken) {
    if (!queryToken.includes("-") && LOW_VALUE_TOKEN_TERMS.has(queryToken)) {
      return Math.max(1, Math.floor(weight * 0.25));
    }
    return weight;
  }
  if (queryToken.includes("-") !== fieldToken.includes("-")) {
    return 0;
  }
  if (!allowPrefix) {
    return 0;
  }
  if (
    LOW_VALUE_TOKEN_TERMS.has(queryToken) ||
    LOW_VALUE_TOKEN_TERMS.has(fieldToken)
  ) {
    return 0;
  }
  if (
    queryToken.length >= 6 &&
    fieldToken.length >= 6 &&
    (fieldToken.startsWith(queryToken) || queryToken.startsWith(fieldToken))
  ) {
    return Math.max(1, Math.floor(weight * 0.6));
  }
  return 0;
}

function scoreNegativeRouting(
  entry: CatalogEntry,
  querySignals: QuerySignal[],
): NegativeScore | undefined {
  if (entry.entryType !== "skill" && entry.entryType !== "subagent") {
    return undefined;
  }
  const negativeRouting = entry.entryType === "skill"
    ? entry.skillContext?.negativeRouting
    : entry.negativeRouting;
  if (!negativeRouting?.doNotUseWhen.length) {
    return undefined;
  }

  const field = entry.entryType === "skill"
    ? "skillContext.negativeRouting.doNotUseWhen"
    : "negativeRouting.doNotUseWhen";
  const fieldScore = scoreLegacyNegativeRoutingExamples(
    field,
    negativeRouting.doNotUseWhen,
    querySignals,
    6,
  );
  if (!fieldScore) {
    return undefined;
  }
  return {
    fields: [field],
    score: fieldScore.score,
    signals: fieldScore.signalBreakdown.map((signal) =>
      signal.candidateTerm ?? signal.term
    ),
    signalBreakdown: fieldScore.signalBreakdown,
  };
}

function scoreLegacyNegativeRoutingExamples(
  field: string,
  values: readonly string[],
  querySignals: QuerySignal[],
  weight: number,
): FieldScore | undefined {
  const scores = values.map((value) => {
    const fieldTerms = normalizeTerms([value]).terms;
    const distinctiveTerms = fieldTerms.filter((term) =>
      !NEGATIVE_ROUTING_GENERIC_TERMS.has(term)
    );
    return scoreFieldTerms(
      field,
      field,
      distinctiveTerms.length > 0 ? distinctiveTerms : fieldTerms,
      querySignals,
      weight,
    );
  }).filter((score): score is FieldScore => score !== undefined);

  if (scores.length === 0) {
    return undefined;
  }

  return {
    field,
    source: field,
    score: scores.reduce((sum, score) => sum + score.score, 0),
    signals: uniqueMatchedSignalStrings(
      scores.flatMap((score) => score.signals),
    ),
    signalBreakdown: uniqueSignals(
      scores.flatMap((score) => score.signalBreakdown),
    ),
  };
}

function scoreStructuredNegativeRouting(
  entry: CatalogEntry,
  querySignals: QuerySignal[],
): NegativeScore | undefined {
  const routing = entryRouting(entry);
  if (!routing) {
    return undefined;
  }
  const fieldScores = [
    scoreField(
      "routing.negativeKeywords",
      "negativeKeywords",
      routing.negativeKeywords?.join(" ") ?? "",
      querySignals,
      fieldWeight(routing, "negativeKeywords"),
    ),
    scoreField(
      "routing.softNegativeExamples",
      "softNegativeExamples",
      routing.softNegativeExamples?.join(" ") ?? "",
      querySignals,
      4,
    ),
  ].filter((score): score is FieldScore => score !== undefined);

  if (fieldScores.length === 0) {
    return undefined;
  }
  return {
    fields: fieldScores.map((score) => score.field),
    score: fieldScores.reduce((sum, field) => sum + field.score, 0),
    signals: [
      ...new Set(
        fieldScores.flatMap((score) =>
          score.signalBreakdown.map((signal) =>
            signal.candidateTerm ??
              signal.term
          )
        ),
      ),
    ],
    signalBreakdown: fieldScores.flatMap((score) => score.signalBreakdown),
  };
}

function scoreRequestNegativeAgainstEntry(
  entry: CatalogEntry,
  query: NormalizedQuery,
): NegativeScore | undefined {
  if (query.negativeSignals.length === 0) {
    return undefined;
  }
  const matches = strictNegativeMatches(
    positiveRoutingValues(entry),
    query.negativeTerms,
  );
  if (matches.length === 0) {
    return undefined;
  }
  return {
    fields: ["request.negativeKeywords"],
    score: matches.length * 10,
    signals: [...new Set(matches)],
    signalBreakdown: toSignals(
      matches,
      "negativeKeywords",
      10,
      "negativeKeywords",
    ),
  };
}

function combineNegativeScores(
  scores: Array<NegativeScore | undefined>,
): NegativeScore | undefined {
  const present = scores.filter((score): score is NegativeScore =>
    score !== undefined
  );
  if (present.length === 0) {
    return undefined;
  }
  return {
    fields: [...new Set(present.flatMap((score) => score.fields))],
    score: present.reduce((sum, score) => sum + score.score, 0),
    signals: [...new Set(present.flatMap((score) => score.signals))],
    signalBreakdown: uniqueSignals(
      present.flatMap((score) => score.signalBreakdown),
    ),
  };
}

function fieldWeight(
  routing: RoutingMetadata | undefined,
  source: RoutingSignalSource | string,
): number {
  const customWeight = routing?.fieldWeights?.[source as RoutingSignalSource];
  if (customWeight !== undefined) {
    return customWeight;
  }
  return DEFAULT_FIELD_WEIGHTS[source] ?? 2;
}

function preferredSkillBoost(
  entry: CatalogEntry,
  query: NormalizedQuery,
): number {
  if (entry.entryType !== "skill" || query.preferredSkillTerms.length === 0) {
    return 0;
  }
  return identifierTerms(entry).some((term) =>
      query.preferredSkillTerms.includes(term)
    )
    ? PREFERRED_SKILL_BOOST
    : 0;
}

function positiveBreakdown(
  fieldScores: FieldScore[],
): Partial<Record<RoutingSignalSource | string, number>> {
  const breakdown: Partial<Record<RoutingSignalSource | string, number>> = {};
  for (const fieldScore of fieldScores) {
    breakdown[fieldScore.source] = (breakdown[fieldScore.source] ?? 0) +
      fieldScore.score;
  }
  return breakdown;
}

function normalizeQuery(request: MatchRequest): NormalizedQuery {
  const ignoredSignals: string[] = [];
  const positiveSignals = [
    ...signalsFrom("task", [request.task], ignoredSignals),
    ...signalsFrom("specialtyHints", request.specialtyHints, ignoredSignals),
    ...signalsFrom("intent", optionalValue(request.intent), ignoredSignals),
    ...signalsFrom(
      "positiveKeywords",
      request.positiveKeywords,
      ignoredSignals,
    ),
    ...signalsFrom("requiredAny", request.requiredAny, ignoredSignals),
    ...signalsFrom("requiredAll", request.requiredAll, ignoredSignals),
    ...signalsFrom("domain", request.domain, ignoredSignals),
    ...signalsFrom("outputNeed", request.outputNeed, ignoredSignals),
  ];
  const negativeSignals = signalsFrom(
    "negativeKeywords",
    request.negativeKeywords,
    ignoredSignals,
  );

  const normalizedPositiveSignals = uniqueQuerySignals(positiveSignals);
  const normalizedNegativeSignals = uniqueQuerySignals(negativeSignals);
  const positiveTerms = [
    ...new Set(normalizedPositiveSignals.map((signal) => signal.term)),
  ];
  const negativeTerms = [
    ...new Set(normalizedNegativeSignals.map((signal) => signal.term)),
  ];

  return {
    positiveSignals: normalizedPositiveSignals,
    positiveTerms,
    positiveTermSet: new Set(positiveTerms),
    negativeSignals: normalizedNegativeSignals,
    negativeTerms,
    intentTerms: normalizeTerms(optionalValue(request.intent)).terms,
    excludedSkillTerms: normalizeTerms(request.excludedSkills).terms,
    preferredSkillTerms: normalizeTerms(request.preferredSkills).terms,
    ignoredSignals: [...new Set(ignoredSignals)],
    hasStructuredSignals: request.intent !== undefined ||
      request.positiveKeywords !== undefined ||
      request.negativeKeywords !== undefined ||
      request.requiredAny !== undefined ||
      request.requiredAll !== undefined ||
      request.excludedSkills !== undefined ||
      request.preferredSkills !== undefined ||
      request.domain !== undefined ||
      request.outputNeed !== undefined,
  };
}

function signalsFrom(
  source: QuerySignal["source"],
  values: readonly string[] | undefined,
  ignoredSignals: string[],
): QuerySignal[] {
  const normalized = normalizeSignalTerms(values);
  ignoredSignals.push(...normalized.ignored);
  return normalized.signals.map((signal) => ({ ...signal, source }));
}

function normalizeTerms(
  values: readonly string[] | undefined,
): { terms: string[]; ignored: string[] } {
  const normalized = normalizeSignalTerms(values);
  return {
    terms: normalized.signals.map((signal) => signal.term),
    ignored: normalized.ignored,
  };
}

function normalizeSignalTerms(
  values: readonly string[] | undefined,
): {
  signals: Array<Pick<QuerySignal, "term" | "termKind">>;
  ignored: string[];
} {
  const signals: Array<Pick<QuerySignal, "term" | "termKind">> = [];
  const ignored: string[] = [];

  for (const value of values ?? []) {
    const comparable = normalizeForComparison(value);
    const aliasTerms = collectAliasTerms(comparable);
    for (const aliasTerm of aliasTerms) {
      if (!STOP_WORDS.has(aliasTerm)) {
        signals.push({ term: aliasTerm, termKind: "alias" });
      }
    }

    const normalized = applyAliases(comparable);
    const compoundMatches = normalized.match(/[a-z0-9]+(?:[-_][a-z0-9]+)+/g) ??
      [];
    for (const compoundMatch of compoundMatches) {
      const compound = compoundMatch.replace(/_/g, "-");
      if (!STOP_WORDS.has(compound)) {
        signals.push({ term: compound, termKind: "phrase" });
      }
    }

    for (const token of normalized.split(/[^a-z0-9]+/)) {
      if (!token) {
        continue;
      }
      if (token.length <= 1 || STOP_WORDS.has(token)) {
        ignored.push(token);
        continue;
      }
      signals.push({ term: token, termKind: "token" });
    }
  }

  return {
    signals: uniqueTermSignals(signals),
    ignored: [...new Set(ignored)],
  };
}

function normalizeIdentityTerms(value: string): string[] {
  const normalized = applyAliases(normalizeForComparison(value));
  const compoundMatches = normalized.match(/[a-z0-9]+(?:[-_][a-z0-9]+)+/g) ??
    [];
  return [...new Set(compoundMatches.map((match) => match.replace(/_/g, "-")))]
    .sort((a, b) => b.length - a.length);
}

function normalizeForComparison(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .trim()
    .toLowerCase();
}

function applyAliases(value: string): string {
  let normalized = value;
  for (const [pattern, replacement] of ALIASES) {
    normalized = normalized.replace(pattern, replacement);
  }
  return normalized;
}

function collectAliasTerms(value: string): string[] {
  const terms: string[] = [];
  for (const [pattern, replacement] of ALIASES) {
    pattern.lastIndex = 0;
    if (pattern.test(value)) {
      terms.push(...normalizeAliasReplacement(replacement));
    }
    pattern.lastIndex = 0;
  }
  return [...new Set(terms)];
}

function normalizeAliasReplacement(replacement: string): string[] {
  return replacement
    .split(/\s+/)
    .map((term) => term.replace(/_/g, "-").trim())
    .filter((term) => term.length > 0);
}

function optionalValue(value: string | undefined): string[] | undefined {
  return value === undefined ? undefined : [value];
}

function missingRequiredValues(
  values: readonly string[] | undefined,
  queryTermSet: Set<string>,
): string[] {
  return (values ?? []).filter((value) =>
    !normalizeTerms([value]).terms.some((term) => queryTermSet.has(term))
  );
}

function missingRequiredAnyValue(
  values: readonly string[] | undefined,
  queryTermSet: Set<string>,
): string[] {
  if (!values?.length) {
    return [];
  }
  return values.some((value) =>
      normalizeTerms([value]).terms.some((term) => queryTermSet.has(term))
    )
    ? []
    : [...values];
}

function matchValues(
  values: readonly string[] | undefined,
  terms: readonly string[],
): string[] {
  const termSet = new Set(terms);
  return (values ?? []).flatMap((value) =>
    normalizeTerms([value]).terms.filter((term) => termSet.has(term))
  );
}

function strictNegativeMatches(
  values: readonly string[] | undefined,
  negativeTerms: readonly string[],
): string[] {
  const compoundTerms = negativeTerms.filter((term) => term.includes("-"));
  return matchValues(
    values,
    compoundTerms.length > 0 ? compoundTerms : negativeTerms,
  );
}

function entryRouting(entry: CatalogEntry): RoutingMetadata | undefined {
  return entry.entryType === "skill" || entry.entryType === "subagent"
    ? entry.routing
    : undefined;
}

function positiveRoutingValues(entry: CatalogEntry): string[] {
  const values = [
    entry.entryKey,
    entry.displayName,
    entry.primarySpecialty,
    ...entry.specialtyTags,
  ];
  if (entry.entryType === "skill") {
    values.push(entry.skillName);
    if (entry.skillContext?.whenToUse) {
      values.push(entry.skillContext.whenToUse);
    }
  }
  if (entry.entryType === "subagent") {
    values.push(entry.name, entry.purpose, entry.limitedScope);
  }
  const routing = entryRouting(entry);
  if (routing) {
    values.push(
      ...(routing.intents ?? []),
      ...(routing.positiveKeywords ?? []),
      ...(routing.requiredAny ?? []),
      ...(routing.requiredAll ?? []),
      ...(routing.domain ?? []),
      ...(routing.outputNeed ?? []),
    );
  }
  return values;
}

function identifierTerms(entry: CatalogEntry): string[] {
  const identifiers = [entry.entryKey, entry.displayName];
  if (entry.entryType === "skill") {
    identifiers.push(entry.skillName);
  }
  if (entry.entryType === "subagent") {
    identifiers.push(entry.name);
  }
  return normalizeTerms(identifiers).terms;
}

function uniqueQuerySignals(signals: QuerySignal[]): QuerySignal[] {
  const seen = new Set<string>();
  return signals.filter((signal) => {
    const key = `${signal.source}\u0000${signal.term}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function uniqueSignals(signals: MatchSignal[]): MatchSignal[] {
  const seen = new Set<string>();
  return signals.filter((signal) => {
    const key = [
      signal.querySource,
      signal.queryTerm,
      signal.candidateSource,
      signal.candidateTerm,
      signal.source,
      signal.term,
      signal.weight,
    ].join("\u0000");
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function uniqueTermSignals(
  signals: Array<Pick<QuerySignal, "term" | "termKind">>,
): Array<Pick<QuerySignal, "term" | "termKind">> {
  const byTerm = new Map<string, Pick<QuerySignal, "term" | "termKind">>();
  for (const signal of signals) {
    const existing = byTerm.get(signal.term);
    if (
      !existing ||
      termKindPriority(signal.termKind) > termKindPriority(existing.termKind)
    ) {
      byTerm.set(signal.term, signal);
    }
  }
  return [...byTerm.values()];
}

function termKindPriority(kind: QuerySignal["termKind"]): number {
  switch (kind) {
    case "alias":
      return 3;
    case "phrase":
      return 2;
    case "token":
      return 1;
  }
}

function toSignals(
  terms: readonly string[],
  source: RoutingSignalSource | string,
  weight: number,
  querySource?: RoutingSignalSource | string,
): MatchSignal[] {
  return [...new Set(terms)].map((term) => ({
    term,
    source,
    weight,
    queryTerm: term,
    querySource,
    candidateTerm: term,
    candidateSource: source,
    matchKind: isNegativeRouteSource(source) ? "negative-route" : "exact",
  }));
}

function formatMatchedSignal(
  querySignal: QuerySignal,
  candidateSource: RoutingSignalSource | string,
  candidateTerm: string,
  matchKind: MatchSignal["matchKind"],
): string {
  return `${querySourceLabel(querySignal.source)}:${querySignal.term} -> ${
    candidateSourceLabel(candidateSource)
  }:${candidateTerm} [${matchKind}]`;
}

function resolveMatchKind(
  querySignal: QuerySignal,
  candidateTerm: string,
  candidateSource: RoutingSignalSource | string,
): MatchSignal["matchKind"] {
  if (isNegativeRouteSource(candidateSource)) {
    return "negative-route";
  }
  if (querySignal.term !== candidateTerm) {
    return "prefix";
  }
  if (querySignal.termKind === "alias") {
    return "alias";
  }
  return querySignal.term.includes("-") ? "phrase" : "token";
}

function isNegativeRouteSource(source: RoutingSignalSource | string): boolean {
  return source === "skillContext.negativeRouting.doNotUseWhen" ||
    source === "negativeRouting.doNotUseWhen" ||
    source === "negativeKeywords" ||
    source === "softNegativeExamples";
}

function querySourceLabel(source: QuerySignal["source"]): string {
  switch (source) {
    case "task":
      return "task text";
    case "specialtyHints":
      return "specialty hint";
    case "intent":
      return "intent";
    case "positiveKeywords":
      return "positive keyword";
    case "negativeKeywords":
      return "negative keyword";
    case "requiredAny":
      return "required-any";
    case "requiredAll":
      return "required-all";
    case "domain":
      return "domain";
    case "outputNeed":
      return "output need";
    default:
      return source;
  }
}

function candidateSourceLabel(source: RoutingSignalSource | string): string {
  switch (source) {
    case "skillName":
      return "skill name";
    case "subagentName":
      return "subagent name";
    case "displayName":
      return "display name";
    case "primarySpecialty":
      return "primary specialty";
    case "specialtyTags":
      return "specialty tag";
    case "skillContext.whenToUse":
      return "skill context";
    case "skillContext.examplePrompts":
      return "skill context";
    case "skillContext.usageNotes":
      return "skill context";
    case "skillContext.negativeRouting.doNotUseWhen":
      return "negative route";
    case "negativeRouting.doNotUseWhen":
      return "negative route";
    default:
      return source;
  }
}

function summaryMatchedSignals(fieldScores: FieldScore[]): string[] {
  return [
    ...new Set(
      fieldScores.flatMap((field) =>
        field.signalBreakdown.map((signal) =>
          signal.candidateTerm ??
            signal.term
        )
      ),
    ),
  ];
}

function uniqueMatchedSignalStrings(signals: string[]): string[] {
  return [...new Set(signals)];
}

function toExcludedCandidate(
  entry: CatalogEntry,
  exclusion: { reasons: string[]; negativeSignals?: MatchSignal[] },
): ExcludedCandidate {
  return {
    scope: entry.scope,
    entryType: entry.entryType,
    entryKey: entry.entryKey,
    displayName: entry.displayName,
    projectName: entry.projectName,
    primarySpecialty: entry.primarySpecialty,
    specialtyTags: entry.specialtyTags,
    excludedBy: [...new Set(exclusion.reasons)],
    matchedSignals: [],
    negativeSignals: uniqueSignals(exclusion.negativeSignals ?? []),
  };
}

function stripExcludedScore(
  candidate: ExcludedCandidate,
): ExcludedMatchCandidate {
  const { score: _score, ...publicCandidate } = candidate;
  return publicCandidate;
}

function explanationSummary(
  entry: CatalogEntry,
  strongestField: string | undefined,
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

function fieldLabel(field: string): string {
  switch (field) {
    case "skillName":
      return "skill name";
    case "subagentName":
      return "subagent name";
    case "routing.intents":
      return "routing intent";
    case "routing.positiveKeywords":
      return "routing keywords";
    case "routing.requiredAny":
      return "required routing signals";
    case "routing.requiredAll":
      return "required routing signals";
    case "routing.domain":
      return "routing domain";
    case "routing.outputNeed":
      return "routing output need";
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
    case "skillContext.negativeRouting.doNotUseWhen":
      return "skill negative routing";
    case "negativeRouting.doNotUseWhen":
      return "subagent negative routing";
    default:
      return field;
  }
}

function rank<T extends MatchCandidate>(candidates: T[]): T[] {
  return candidates.sort((a, b) =>
    b.score - a.score || a.displayName.localeCompare(b.displayName)
  );
}

function topAgentsAreAmbiguous(
  agents: ScoredMatchCandidate[],
  queryTerms: string[],
): boolean {
  const candidates = nearEqualTopAgents(agents);
  return candidates.length > 1 &&
    !hasDeterministicAgentSelection(candidates, queryTerms);
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
  queryTerms: string[],
): boolean {
  return hasExactProjectNameAdvantage(candidates, queryTerms) ||
    hasPrimarySpecialtyAdvantage(candidates);
}

function hasExactProjectNameAdvantage(
  candidates: ScoredMatchCandidate[],
  queryTerms: string[],
): boolean {
  const [topCandidate, ...rest] = candidates;
  if (!topCandidate || !projectNameExactlyMatches(topCandidate, queryTerms)) {
    return false;
  }
  return rest.some((candidate) =>
    !projectNameExactlyMatches(candidate, queryTerms)
  );
}

function projectNameExactlyMatches(
  candidate: ScoredMatchCandidate,
  queryTerms: string[],
): boolean {
  const queryTokenSet = new Set(queryTerms);
  const projectTokens = normalizeTerms([candidate.projectName]).terms;
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
  field: string,
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
