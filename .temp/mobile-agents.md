# Mobile Agent Instructions

Use this file with root `AGENTS.md` for Expo React Native work.

## Stack Rules

- Prefer Expo-managed React Native unless the project requires native folders.
- Keep screens focused on layout and orchestration.
- Reuse shared components, tokens, and navigation conventions before adding new
  patterns.
- Keep platform-specific behavior explicit at the point of use.
- Treat client-visible environment values as public.
- Ask before adding navigation, styling, state, native-module, auth/payment,
  analytics, provider, build-service, or deployment dependencies.

## Relevant Skills

- `okan-react-native-app-initializer`: initialize or normalize Expo setup.
- `okan-figma-to-mobile-implementation-agent`: implement mobile UI from Figma.
- `okan-mobile-design-system-sync-agent`: synchronize tokens and components.
- `okan-nativewind-best-practices-agent`: review or fix NativeWind usage.
- `okan-mobile-accessibility-audit-agent`: audit or remediate accessibility.
- `okan-mobile-qa-smoke-test-agent`: plan or run focused mobile QA.
- `okan-expo-release-checklist-agent`: audit Expo/EAS release readiness.
- `okan-eas-build-submit-operator`: run EAS build/submit when requested.
- `okan-push-notification-implementation-agent`: implement or audit push notifications.
- `okan-app-onboarding-flow-designer`: plan or design onboarding flows.
- Skills do not expand folder ownership or dependency approval.

## Boundaries

- Follow the project's existing app shell, feature, navigation, and component
  structure.
- Keep config helpers and pure logic testable without device APIs.
- Keep tests beside the code they verify when local conventions allow it.
- Do not commit native build output, local environment files, or credentials.

## Verification

- Identify the local package-manager scripts before editing.
- Run focused tests, linting, and type checks during implementation.
- Before handoff, run the project's strongest available check.
- For UI or device behavior, record the simulator, device, and platform checked.
