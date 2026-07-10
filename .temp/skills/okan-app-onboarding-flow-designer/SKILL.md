---
name: okan-app-onboarding-flow-designer
description: App onboarding flow and Figma onboarding screen design skill. Use when Codex needs to plan, audit, design, update, or create alternatives for app onboarding flows, first-run education, setup sequencing, onboarding forms, permission education, guest/account paths, conversion moments, completion states, and implementation-ready onboarding handoff notes. Do not use for general product screens, Design Language foundations, token systems, component-library cleanup, marketing assets, backend work, mobile implementation, or broad PM planning.
---

# App Onboarding Flow Designer

Use Figma as the source of truth for onboarding flows and first-run product setup.

## Operating Model

- Start by inspecting current onboarding, auth, and relevant product screens before planning or designing.
- Identify the onboarding needs for the specific app; do not assume every app needs the same sequence.
- Preserve existing approved onboarding frames unless the user explicitly asks for an in-place update.
- Create alternatives beside source frames by default, with explicit frame names and state labels.
- Reuse existing design language, components, screen shells, and copy patterns before creating new local structures.
- Keep onboarding implementation-ready: clear step order, actions, skip/defer rules, permission rationale, and handoff assumptions.

## Scope

Use this skill for:

- Welcome, value-prop, and first-run education flows.
- Setup sequencing for preferences, schedules, reminders, profile fields, or app-specific defaults.
- Permission education and opt-in screens.
- Guest, account creation, sign-in, and conversion paths when they are part of onboarding.
- Pro/subscription gates when they are part of first-run setup or conversion.
- Completion, handoff into the app, and first-use next-step screens.
- Onboarding variants, copy updates, and flow handoff notes.

Do not use this skill for:

- General product screens or feature states outside onboarding.
- Design Language foundations, color systems, typography systems, or token changes.
- Component-library promotion, component variants, or broad relinking.
- Marketing visuals, store listings, screenshots, landing pages, or public-site design.
- Backend, mobile, frontend implementation, analytics instrumentation, or broad PM planning.

## Onboarding Design Rules

- Lead with the minimum explanation needed for the user to make the next decision.
- Prefer progressive setup over long forms unless the app genuinely needs a complete upfront configuration.
- Make skip, defer, and required-step behavior explicit when it affects implementation.
- Keep permission requests contextual: explain why the app needs the permission before the system prompt moment.
- Avoid exaggerated claims; onboarding copy should reflect real app capabilities.
- Keep user control clear for AI, subscription, notification, or automation features.

## Figma Workflow

- Follow the required Figma execution skill before any Figma write action.
- Inspect the current Onboarding page and related Auth/product pages before creating new frames.
- Place new alternatives near the relevant source frames and keep approved frames unchanged unless asked.
- Use Auto Layout deliberately: fixed viewport frames, `Hug contents` for cards/rows/buttons/text-led groups, and `Fill container` only where children should stretch.
- Name frames with stable flow/state names such as `Onboarding / Reminder Setup`, `Onboarding / Brief Times`, or `Onboarding / Complete`.

## QA Rules

- Before reporting completion, check for clipped text, collapsed frames, missing fonts, unclear actions, broken step order, and unexpected fixed vertical sizing.
- Confirm onboarding screens explain value, collect only necessary setup information, and hand off cleanly into the product.
- Report created or updated frames, key flow assumptions, skipped/deferred states, and any implementation caveats.

## Reference Files

- Read `references/onboarding-flow-checklist.md` when planning flow structure or missing onboarding states.
- Read `references/figma-onboarding-workflow.md` before creating or updating Figma onboarding frames.
- Read `references/onboarding-copy-and-handoff.md` when writing onboarding copy or implementation notes.
