# App Store Connect Field Answer Patterns

## Metadata

- Promotional text: short launch/update hook, max 170 characters.
- Description: explain actual features, avoid exaggerated claims, mention subscription requirements for paid features.
- Keywords: comma-separated, no spaces required, max 100 characters.
- Support URL: must be live and public.
- Marketing URL: optional; use only if live.
- Subtitle: concise benefit, max 30 characters.

## App Review Information

If guest mode is available, sign-in can be marked not required and notes should explain the guest path.

If paid/auth-only features need review, provide a stable reviewer account and state whether it has Pro access.

Review notes should include only necessary setup, feature path, and caveats such as notification permission being optional.

## App Privacy

Common categories:

- Email Address: App Functionality for auth/account/support; linked to user; not tracking unless used for cross-app tracking or ads.
- Other User Content: App Functionality and Product Personalization when user-created content powers app features, summaries, or recommendations; linked to user when stored with account.
- User ID: App Functionality for auth/sync/entitlements; linked to user; not tracking unless shared for cross-app tracking.
- Device ID: App Functionality for push/device registration/security; linked to user if tied to account; not tracking unless used across apps/sites.
- Purchase History: App Functionality for subscription validation/restoration; linked to user; not tracking.
- Crash/Performance Data: App Functionality and Analytics when used to diagnose and improve reliability; linked only if logs include account/device identifiers.

Do not select data categories that are not actually collected. Do not select Health & Fitness solely because users can type health-related habit names unless the app formally collects health/fitness data.

## Compliance

- DSA: commercial EU distribution generally requires trader information; non-trader is only appropriate when accurate or when not distributing in the EU.
- Age Rating: productivity/planning apps are often 4+, but AI chat, user-generated public content, web access, or medical/wellness claims can change answers.
- Export Compliance: apps using only standard HTTPS/TLS and platform crypto usually set non-exempt encryption to false.
- Regulated Medical Device: answer no unless the app diagnoses, treats, monitors, or prevents disease or is intended as a regulated medical device.

## Subscriptions

Use auto-renewable subscriptions for recurring Pro access. Use non-consumable only for one-time lifetime unlocks. Do not use consumables for Pro access.

Required checks:

- Subscription group exists.
- Product IDs match mobile config and backend.
- Duration, price, localization, review screenshot, and review notes are complete.
- First subscription is attached to the app version submission.
- Paywall includes price, period, auto-renewal/cancellation context, restore purchases, and legal links.

## Server Notifications

Only provide App Store Server Notification URLs when backend endpoints are implemented, deployed, and verified. Otherwise leave them empty for first submission.
