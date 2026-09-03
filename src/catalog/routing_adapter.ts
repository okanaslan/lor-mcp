import type { MatchRequest } from "@src/catalog/types.ts";

const PR_FEEDBACK_CANONICAL_TASK =
  "Evaluate existing pull request reviewer feedback for current validity, stale or already-fixed status, impact, importance, ease of fix, and how to fix.";

const PR_FEEDBACK_HINTS = [
  "pr-feedback",
  "reviewer-feedback",
  "existing-review-comments",
  "comment-validity",
  "still-valid",
  "already-fixed",
  "stale-comments",
  "outdated-comments",
  "issue-impact",
  "ease-of-fix",
  "how-to-fix",
  "fix-or-defer",
];

const PR_FEEDBACK_EXCLUDED_INTENTS = [
  "fresh-pr-review",
  "pr-description",
  "commit",
  "implementation-only",
  "review-comment-writing",
];

interface RoutingIntentRule {
  intent: string;
  canonicalTask: string;
  preferredEntryKeys: readonly string[];
  specialtyHints: readonly string[];
  negativeHints: readonly string[];
  matches: readonly RegExp[];
  rejects?: readonly RegExp[];
}

const ROUTING_INTENT_RULES: readonly RoutingIntentRule[] = [
  {
    intent: "received-pr-feedback-triage",
    canonicalTask: PR_FEEDBACK_CANONICAL_TASK,
    preferredEntryKeys: ["pr-feedback-evaluator"],
    specialtyHints: PR_FEEDBACK_HINTS,
    negativeHints: PR_FEEDBACK_EXCLUDED_INTENTS,
    matches: [
      /\bpr\s+feedback\s+evaluator\b/i,
      /\bpr\s+comments?\b/i,
      /\bpr\s+review\s+comments?\b/i,
      /\breviewer'?s?\s+feedback\b/i,
      /\breviewer\s+comments?\b/i,
      /\breceived\s+(?:pr\s+)?feedback\b/i,
      /\bexisting\s+(?:pr\s+)?(?:review\s+)?comments?\b/i,
      /\bunresolved\s+(?:pr\s+)?(?:review\s+)?threads?\b/i,
      /\bstill\s+valid\b/i,
      /\balready\s+fixed\b/i,
      /\bstale\b/i,
      /\boutdated\b/i,
      /\bhow\s+to\s+fix\b/i,
      /\bease\s+of\s+fix\b/i,
      /\bfix\s+it,\s*defer\s+it,\s*or\s+reject\b/i,
      /\bissue,\s*impact,\s*importance\b/i,
    ],
    rejects: [
      /\bfrom\s+scratch\b/i,
      /\bfresh\s+(?:full\s+)?(?:pr\s+)?review\b/i,
      /\bpr\s+description\b/i,
      /\bpr\s+body\b/i,
      /\bcommit(?:\s+all|\s+message)?\b/i,
      /\bcopy-ready\s+inline\b/i,
      /\bturn\s+findings\b/i,
      /\bimplement\s+(?:the\s+)?(?:selected\s+)?fix\b/i,
    ],
  },
  {
    intent: "fresh-pr-review",
    canonicalTask:
      "Review the pull request from scratch for new branch-introduced findings.",
    preferredEntryKeys: ["code-review", "okan-code-review"],
    specialtyHints: ["code-review", "branch-review", "fresh-pr-review"],
    negativeHints: ["received-pr-feedback-triage"],
    matches: [
      /\bfrom\s+scratch\b/i,
      /\bfresh\s+(?:full\s+)?(?:pr\s+)?review\b/i,
      /\bbranch-introduced\s+bugs?\b/i,
    ],
  },
  {
    intent: "pr-description",
    canonicalTask:
      "Create a pull request description for the current branch changes.",
    preferredEntryKeys: ["okan-pr-description"],
    specialtyHints: ["pr-description", "summary", "test-plan"],
    negativeHints: ["received-pr-feedback-triage"],
    matches: [
      /\bpr\s+description\b/i,
      /\bpr\s+body\b/i,
      /\bpull\s+request\s+description\b/i,
    ],
  },
  {
    intent: "commit",
    canonicalTask: "Create a local commit for the current branch changes.",
    preferredEntryKeys: ["okan-commit-message"],
    specialtyHints: ["commit", "conventional-commits"],
    negativeHints: ["received-pr-feedback-triage"],
    matches: [
      /\bcommit\s+all\b/i,
      /\bcommit\s+(?:the\s+)?(?:current\s+)?changes\b/i,
      /\bcommit\s+message\b/i,
    ],
  },
  {
    intent: "review-comment-writing",
    canonicalTask:
      "Turn selected findings into copy-ready inline pull request review comments.",
    preferredEntryKeys: ["okan-create-review-comments"],
    specialtyHints: ["inline-comments", "review-comments"],
    negativeHints: ["received-pr-feedback-triage"],
    matches: [
      /\bcopy-ready\s+inline\b/i,
      /\bturn\s+findings\b/i,
      /\binline\s+pr\s+review\s+comments?\b/i,
    ],
  },
];

export function adaptMatchRequest(request: MatchRequest): MatchRequest {
  const matchedRule = findRoutingIntentRule(request);
  const explicitNegativeHints = mergeLists(
    request.negativeKeywords,
    request.negativeHints,
    request.excludeIntents,
  );
  const explicitPreferredEntryKeys = mergeLists(
    request.preferredSkills,
    request.preferredEntryKeys,
  );
  const explicitExcludedEntryKeys = mergeLists(
    request.excludedSkills,
    request.excludedEntryKeys,
  );

  if (!matchedRule) {
    return {
      ...request,
      task: request.canonicalTask ?? request.task,
      negativeKeywords: explicitNegativeHints,
      preferredSkills: explicitPreferredEntryKeys,
      excludedSkills: explicitExcludedEntryKeys,
    };
  }

  return {
    ...request,
    task: request.canonicalTask ?? matchedRule.canonicalTask,
    canonicalTask: request.canonicalTask ?? matchedRule.canonicalTask,
    intent: request.intent ?? matchedRule.intent,
    specialtyHints: mergeLists(
      request.specialtyHints,
      matchedRule.specialtyHints,
    ),
    negativeKeywords: mergeLists(
      explicitNegativeHints,
      matchedRule.negativeHints,
    ),
    preferredSkills: mergeLists(
      explicitPreferredEntryKeys,
      matchedRule.preferredEntryKeys,
    ),
    excludedSkills: explicitExcludedEntryKeys,
  };
}

function findRoutingIntentRule(
  request: MatchRequest,
): RoutingIntentRule | undefined {
  const text = [
    request.task,
    request.canonicalTask,
    request.intent,
    ...(request.specialtyHints ?? []),
    ...(request.positiveKeywords ?? []),
    ...(request.requiredAny ?? []),
    ...(request.requiredAll ?? []),
  ].filter((value): value is string => Boolean(value)).join(" ");

  return ROUTING_INTENT_RULES.find((rule) =>
    rule.matches.some((pattern) => pattern.test(text)) &&
    !(rule.rejects ?? []).some((pattern) => pattern.test(text))
  );
}

function mergeLists(
  ...lists: Array<readonly string[] | undefined>
): string[] | undefined {
  const values = lists.flatMap((list) => list ?? [])
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
  return values.length > 0 ? [...new Set(values)] : undefined;
}
