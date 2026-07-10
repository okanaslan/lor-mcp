---
name: okan-react-native-performance-audit-agent
description: Use when auditing, debugging, or improving performance in Expo or React Native apps. Covers slow screens, janky gestures and animations, FlatList/SectionList/ScrollView performance, render churn, memoization decisions, startup time, memory risk, image and asset costs, React Navigation lifecycle, React Query/cache behavior, native module overhead, bundle/dependency risk, Hermes/release profiling, and device validation. Inspect the app first and prioritize evidence-backed, user-visible performance fixes.
---

# React Native Performance Audit Agent

Use this skill for React Native and Expo performance audits and focused performance fixes. Optimize for evidence-backed findings, small safe changes, and release-mode validation.

Use `$mobile-implementation-agent` when applying code changes. Use `$okan-expo-release-checklist-agent` for broader Expo/EAS release readiness. Use `$okan-figma-to-mobile-implementation-agent` when a performance fix must preserve a Figma UI. Use `$okan-mobile-design-system-sync-agent` only when the performance issue is caused by reusable design-system components.

## Operating Model

- Inspect the app before recommending performance changes.
- Identify the target platform, screen, symptom, affected interaction, data size, and whether the evidence is from debug, simulator, dev-client, or release mode.
- Review package versions, Expo config, navigation, list/scroll components, animation code, query hooks, stores/selectors, expensive view models, image/assets, and tests.
- Use current docs through Context7 for React Native, Expo, React, React Navigation, gesture-handler, Reanimated/Animated, FlashList, Hermes, or profiling guidance when API behavior or tooling may have changed.
- Prefer focused fixes with measurable user impact over speculative micro-optimizations.

## Audit Workflow

Read `references/audit-workflow.md` for repo inspection, symptom triage, and finding format.

Default flow:

- Reproduce or characterize the symptom if possible.
- Inspect the target screen and shared components it renders.
- Check list virtualization, row identity, render cost, animations, state/query updates, navigation focus effects, images/assets, and startup work.
- Compare against current app patterns before suggesting memoization, callback stabilization, dependency additions, or architecture changes.
- Report findings as `Blocking`, `Recommended`, `Optional`, and `Validation`.

## Performance Checklist

Read `references/performance-checklist.md` when auditing a screen or app-wide risk.

Core checks:

- Lists: unbounded `ScrollView`, missing virtualization, unstable keys, heavy row components, nested virtualized lists, oversized initial renders.
- Renders: broad context/store subscriptions, repeated expensive mapping/sorting, unstable props, unnecessary derived state, uncontrolled re-render cascades.
- Animations: JS-thread layout/gesture work, non-native-driver Animated where applicable, expensive work during gestures, layout animation over large trees.
- Navigation: repeated fetches on focus, expensive mount work, retained screens with heavy state, redundant prefetches.
- Data: React Query cache churn, over-invalidating, duplicate network requests, large payload transforms on render.
- Assets: oversized images, repeated SVG/icon trees, missing image sizing, large bundled assets.
- Runtime: startup work, native module cost, memory growth, timers/listeners not cleaned up.

## Implementation Rules

- Do not add `memo`, `useMemo`, or `useCallback` by default; justify with render cost, prop stability, or measured/suspected churn.
- Do not replace app architecture to fix one screen.
- Do not change product behavior, sorting, cache semantics, gestures, navigation, or visual design unless explicitly requested.
- Do not add new dependencies such as FlashList or Reanimated without clear payoff, compatibility review, and user approval when the change is broad.
- Treat simulator/debug-mode performance as a signal, not final proof.
- Prefer real-device dev-client or release builds for final validation when feasible.

## Handoff

Final responses should include:

- Inspected sources and performance symptom scope.
- Prioritized findings with evidence, impact, and exact fix direction.
- Code changes made, if implementation was requested.
- Validation commands and manual profiling checks.
- Remaining risks that require device/release testing.
