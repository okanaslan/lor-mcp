# App Store Submission Checklist

## Blocking

- App identity: app name, bundle ID, SKU, primary language, category, version, copyright.
- Build: uploaded iOS build selected on the app version, correct bundle ID, production API/env, no simulator/internal-only config.
- Legal URLs: privacy policy URL live; support URL live; terms/EULA link available when subscriptions are present.
- App Privacy: data collection categories, purposes, linked-to-user answers, and tracking answers match actual app behavior and SDKs.
- Age Rating: questionnaire completed truthfully for content, AI/chat, medical/wellness, gambling, violence, mature themes, and web access.
- Export Compliance: encryption answers match actual cryptography; standard HTTPS/TLS/system crypto usually means non-exempt encryption is false.
- App Review Info: contact details, notes, demo account or guest instructions, and any Pro access instructions.
- First IAP/subscription: created, fully localized, priced, review screenshot attached, and selected on the app version before submission.

## Recommended

- Smoke test production build on a real device: fresh install, onboarding, guest/auth, core flows, subscriptions, restore purchases, push permission denial, dark/light mode, localization.
- Run project validation: typecheck, lint, tests, API/schema checks, Expo doctor or Xcode archive validation where applicable.
- Confirm metadata claims match implemented features and screenshots.
- Confirm subscription product IDs exactly match app config/env and backend entitlement handling.
- Confirm backend production URLs are deployed and reachable.

## Optional

- App Store Server Notifications configured if backend webhooks are implemented.
- Promotional text, marketing URL, privacy choices URL, custom license agreement, subscription promo image.
- TestFlight external testing before App Review.
- Billing grace period and family sharing, only if intentionally supported.
