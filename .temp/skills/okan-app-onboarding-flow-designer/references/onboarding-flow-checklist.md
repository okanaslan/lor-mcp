# Onboarding Flow Checklist

Use this checklist to audit or plan app-specific onboarding.

## Possible Flow Areas

- Welcome and value proposition.
- Account, guest, sign-in, and create-account paths.
- Profile or identity setup.
- Product preferences and default settings.
- Schedule, reminder, notification, and permission education.
- App-specific setup fields or first objects to create.
- Subscription, Pro, or locked-feature education when relevant.
- AI/automation explanation and user-control expectations when relevant.
- Completion, confirmation, and handoff into the main app.

## Decisions To Lock

- Which steps are required, optional, skippable, or deferrable.
- Whether setup happens before or after account creation.
- What default values are shown and why.
- What happens after completion.
- What states are needed: loading, validation, error, denied permission, guest, locked, or success.

## Rules

- Do not force a universal onboarding structure onto every app.
- Keep setup proportional to first-run value.
- Avoid collecting data before the user understands why it matters.
- Keep state names explicit and implementation-ready.
