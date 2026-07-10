# Data Category Patterns

These are operational patterns. Confirm against the actual app and vendor behavior before final store answers.

## Common Apple App Privacy Mappings

### Email Address

Use when email is collected for account creation, login, support, or communication.

Typical purpose: App Functionality. Add Developer Advertising or Marketing only if used for marketing emails. Usually linked to user. Not tracking unless shared for cross-app/site profiling or ads.

### User ID

Use when backend account ID, auth subject, or internal user identifier exists.

Typical purpose: App Functionality. Usually linked to user. Not tracking unless shared with tracking/advertising vendors.

### Device ID

Use when install/device IDs, push tokens, advertising IDs, or backend device registration IDs are collected.

Typical purpose: App Functionality for notifications, security, account/session support. Usually linked when associated with a user account. Tracking depends on cross-app/site use or ad attribution.

### Other User Content

Use for user-entered tasks, notes, messages, plans, prompts, reports, uploads, or app-specific records.

Typical purposes: App Functionality and Product Personalization when content personalizes summaries/recommendations. Linked when stored with account. Not tracking unless shared for cross-app/site profiling.

### Purchase History

Use for subscriptions, purchases, entitlement validation, restore purchases, receipts, or transaction tokens.

Typical purpose: App Functionality. Usually linked to user. Not tracking unless used/shared for advertising profiling.

### Diagnostics

Use Crash Data and Performance Data when crash/performance tools collect reports.

Typical purposes: App Functionality and Analytics. Linked only if logs include account/device identifiers. Not tracking unless shared for cross-app/site profiling.

### Contact Info Beyond Email

Use name, phone, address only if the app collects them directly or through account/profile/support flows.

### Precise/Coarse Location

Use only when app requests or transmits location. Timezone/locale is not the same as location unless represented as location data by store definitions.

### Health And Fitness

Use only when the app formally collects health/fitness data, integrates health APIs, or represents data as health/fitness records. User-typed habit names alone usually fit Other User Content.

## Play Data Safety Parallels

For each collected type, answer:

- collected: yes/no
- shared: yes/no, based on third-party transmission and policy definitions
- processed ephemerally: only if not retained beyond real-time handling
- required or optional: whether app feature works without it
- purpose: app functionality, analytics, account management, developer communications, fraud/security, personalization
- deletion: whether users can request/delete account and associated data

## Tracking/Sharing Red Flags

Potential tracking/shared-data indicators:

- ad SDKs or ad network identifiers.
- attribution SDKs used across apps/sites.
- data brokers or third-party advertising partners.
- analytics configured to share data beyond service-provider processing.
- using email/device/user ID to target ads across unrelated apps or websites.

## Permission Disclosure Patterns

- Push notifications: disclose device token/device ID if registered server-side.
- Camera/photos/microphone/location/contacts/calendar/health: require corresponding store disclosures and in-app permission rationale.
- Network/API access alone is not a privacy category unless data is transmitted and retained or accessible beyond immediate processing.
