# Privacy Audit Sources

Inspect these sources before answering app-specific privacy questions.

## Mobile App Config

- `app.json`, `app.config.*`: permissions, plugins, bundle/package IDs, owner/project IDs, notification config, encryption flags.
- iOS native files if present: `Info.plist`, entitlements, privacy manifests, usage descriptions.
- Android native files if present: `AndroidManifest.xml`, permissions, services, receivers, billing/notification config.
- `eas.json`, `.env.example`, local env docs: API hosts, client-visible product IDs, public config.

## Dependencies And SDKs

Search package manifests for:

- analytics: Firebase Analytics, Amplitude, Segment, PostHog, Mixpanel.
- crash/performance: Sentry, Firebase Crashlytics, Bugsnag, Datadog.
- ads/attribution: AdMob, Meta/Facebook SDK, Adjust, AppsFlyer, Branch.
- auth/social: Google, Apple, Facebook auth providers.
- billing: StoreKit, RevenueCat, expo-iap, react-native-iap.
- notifications: Expo Notifications, Firebase Messaging, OneSignal.
- device/data access: location, camera, microphone, contacts, photo library, health, calendar.
- AI vendors: OpenAI or other AI APIs handling user content.

## Source Code

Search for code paths involving:

- account creation/login/logout, session storage, account update, account deletion.
- user-generated content: notes, tasks, messages, media, documents, AI prompts, reports.
- push token registration and device IDs.
- subscription purchase/restore/sync and transaction tokens.
- privacy/settings links, data export/delete controls, consent toggles.
- diagnostics, logging, analytics events, crash capture, performance traces.

## Backend/API Surfaces

If backend code or generated schema is available, inspect:

- auth/user/profile endpoints.
- subscription, billing, webhook, and entitlement endpoints.
- notification device/preference endpoints.
- user content, chat, inbox, report, AI, tracker, and task endpoints.
- account deletion/export endpoints.
- admin, support, audit log, or diagnostic endpoints.

## Business Facts To Confirm

Ask the user when not discoverable:

- Are marketing emails sent?
- Are analytics/crash dashboards enabled in production?
- Are logs retained with user identifiers?
- Are vendors/processors used outside visible SDKs?
- Are privacy/support/deletion URLs live?
- Is the app commercially distributed in the EU?
- Are user data export/delete requests handled manually or in-app?
