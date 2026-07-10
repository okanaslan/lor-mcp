# React Native Performance Audit Workflow

Use this reference when auditing a React Native or Expo app for performance.

## Inspect First

Start with repo truth:

- `package.json`: React, React Native, Expo SDK, navigation, animation, list, image, query, and state libraries.
- `app.json` / `app.config.*`: Expo plugins, new architecture/Hermes-related config, updates, assets, permissions, native modules.
- Navigation entrypoints and target screens.
- List and scroll components: `FlatList`, `SectionList`, `VirtualizedList`, `ScrollView`, custom list cards, and nested scroll areas.
- Animation and gesture code: `Animated`, `LayoutAnimation`, Reanimated, gesture-handler, timers, and loops.
- Data hooks: React Query hooks, cache invalidation, focus prefetch, selector subscriptions, and transforms.
- Shared UI primitives used by the target screen.
- Validation scripts and focused tests.

## Symptom Triage

Classify the issue before proposing fixes:

- Startup: slow launch, slow first screen, expensive provider setup, font/assets/config loading.
- Interaction: dropped frames while scrolling, swiping, dragging, typing, opening sheets, or switching tabs.
- Data: slow loading, repeated requests, expensive transforms, cache churn.
- Memory: growing memory, large lists, retained screens, uncleaned listeners/timers.
- Bundle/dependency: oversized assets, unnecessary native modules, dev-only dependencies in runtime path.

Record whether evidence comes from a simulator, debug build, dev-client, release build, or real device.

## Finding Format

Use concise findings:

- Severity: `Blocking`, `Recommended`, or `Optional`.
- Evidence: file/component/pattern and why it is costly.
- Impact: user-visible symptom or release risk.
- Fix: smallest safe change that preserves behavior.
- Validation: command or manual profiling step.

## Implementation Path

When asked to fix issues:

1. Preserve behavior and visual output.
2. Change the narrowest component or hook that owns the cost.
3. Prefer data/view-model precomputation outside render when already consistent with app patterns.
4. Use virtualization before row memoization for large lists.
5. Stabilize props only when row/component memoization can use it.
6. Avoid broad dependency additions unless the current primitive cannot meet the requirement.
7. Add or update tests for view-model outputs, helper behavior, or regression-prone transformations.

## Validation

Use available local checks:

- `npm run typecheck`
- `npm run lint`
- Focused Jest tests for changed helpers/view models.
- `npx expo-doctor` or project release checks when dependency/config risk is part of the finding.

Manual validation should include real-device or release/dev-client profiling for animation, scrolling, startup, and memory claims.
