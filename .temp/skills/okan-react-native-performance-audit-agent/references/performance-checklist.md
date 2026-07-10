# React Native Performance Checklist

Use this checklist for screen-level or app-wide performance audits.

## Lists And Scroll Containers

- Avoid rendering large dynamic collections inside plain `ScrollView`.
- Prefer `FlatList` or `SectionList` for unknown or large row counts.
- Check `keyExtractor` stability and avoid index keys for mutable collections.
- Keep row components small and avoid expensive inline transforms per row.
- Tune `initialNumToRender`, `windowSize`, `maxToRenderPerBatch`, and empty/loading states only when there is evidence.
- Avoid nested virtualized lists with the same scroll direction.
- Consider FlashList only when current virtualization is insufficient and dependency impact is acceptable.

## Render Churn

- Look for broad context/store subscriptions that re-render whole screens.
- Move expensive sorting/grouping/mapping out of render when inputs are stable.
- Use memoization only when it prevents real repeated work or enables memoized children.
- Avoid recreating large objects/arrays passed to heavy children if those children depend on referential stability.
- Check React Query selectors, derived view models, and cache invalidation breadth.

## Animations And Gestures

- Prefer native-driver-compatible animations where possible with `Animated`.
- Avoid heavy JS work during gesture updates and scroll handlers.
- Be careful with `LayoutAnimation` across large trees.
- Ensure animation loops clean up on unmount.
- Use Reanimated only when the app already depends on it or the interaction requires UI-thread animation.

## Navigation And Lifecycle

- Check focus effects and tab switches for repeated prefetch or redundant network work.
- Avoid expensive screen initialization for hidden tabs when not needed.
- Ensure listeners, timers, subscriptions, and notification handlers clean up.
- Preserve navigation state and cache semantics when optimizing mounts.

## Data And Network

- Avoid duplicate queries for the same data under different keys.
- Avoid broad invalidation that refetches unrelated heavy screens unless product correctness requires it.
- Keep heavy response transforms in query selectors or view-model helpers when consistent with the app.
- Validate loading, empty, error, and stale states after query changes.

## Assets And Native Modules

- Check image dimensions, SVG/icon repetition, bundled asset size, and font loading.
- Avoid large images without explicit sizing or resizing strategy.
- Confirm native modules are necessary for production builds.
- Treat dev-client-only modules and debug tooling as release risks if they affect startup or bundle size.

## Release Validation

- Debug performance is not final evidence; validate with a release or production-like build.
- Test on representative low/mid-tier devices when possible.
- Check scroll FPS, input latency, sheet open/close, tab switch time, startup time, memory growth, and network duplicate requests.
- Document what could not be measured locally.
