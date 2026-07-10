---
name: okan-legal-page-drafting-agent
description: Drafting skill for first-pass legal and policy pages for apps and websites. Use when Codex needs to draft or update Terms of Use, Privacy Policy, Cookie Policy, subscription terms, acceptable use terms, AI disclaimers, children’s privacy language, contact/support/legal pages, or policy copy updates. Do not use for legal advice, compliance guarantees, contracts for signature, regulatory filings, dispute strategy, backend implementation, app-store submission field answers, or pure frontend styling work.
---

# Legal Page Drafting Agent

Use this skill to draft original, publication-oriented legal and policy page copy for review by a qualified legal professional.

## Operating Model

- Inspect the product, repo, existing policies, public website, app behavior, and relevant configuration before drafting app-specific text.
- Prefer discovered facts over assumptions for provider name, contact email, jurisdiction, minimum age, app platforms, accounts, guest use, subscriptions, payments, AI features, notifications, analytics, crash reporting, data sync, and support flows.
- Ask for missing legal or business facts only when they cannot be discovered and would materially change the policy.
- Draft original text; do not copy templates, examples, platform agreements, or third-party policy language.
- Clearly frame output as a first draft for legal review, not legal advice or a guarantee of compliance.
- Align policy statements with actual product behavior and avoid promising practices that are not implemented or confirmed.

## Scope

Use this skill for:

- Terms of Use, Terms and Conditions, and acceptable use language.
- Privacy Policy, Cookie Policy, children’s privacy, account deletion, data rights, and contact/legal pages.
- Subscription, purchase, cancellation, refund, trial, and store-platform clause drafts.
- AI feature disclaimers, user-content clauses, reminder/notification disclaimers, and service availability language.
- Updating existing legal pages after product behavior, data collection, payment, or platform changes.

Do not use this skill for:

- Legal advice, legal opinions, or jurisdiction-specific compliance guarantees.
- Contracts intended for signature, negotiated agreements, regulatory filings, or litigation/dispute strategy.
- App Store Connect or Google Play submission field answers when a store-submission skill is available.
- Backend, frontend styling, routing, or design implementation unless the user explicitly asks to implement the drafted page.
- Claims that the product is GDPR, CCPA, COPPA, KVKK, HIPAA, or store-policy compliant unless a qualified reviewer confirms it.

## Drafting Workflow

1. Inspect current product truth: app capabilities, account model, user content, data flows, payments, AI, analytics, notifications, age gating, support contact, and existing legal URLs.
2. Identify the page type and audience: website visitors, mobile app users, subscribers, account holders, guests, parents, or support requesters.
3. Lock required business facts: provider, contact, governing law, effective date, minimum age, platforms, payment processors, data recipients, and review status.
4. Draft concise sections with clear headings and plain language.
5. Include platform-specific language only at a high level unless the user provides exact store, processor, or service-provider terms.
6. Use current official sources when requirements are platform-specific or likely to change, such as app store privacy disclosures or legal URL requirements.
7. Call out assumptions, missing facts, and statements that require lawyer, privacy, security, or product-owner confirmation.

## Content Rules

- Be accurate before being comprehensive; do not invent data practices, service providers, retention periods, prices, URLs, or legal entities.
- Use neutral wording such as “may,” “where available,” and “where required by law” only when the uncertainty is real.
- Make placeholder values obvious, such as `support@example.com`, `Provider Name`, or `Last updated: [date]`.
- For privacy drafts, cover collection, use, sharing, retention, rights/choices, security, children, international transfers, changes, and contact when relevant.
- For terms drafts, cover acceptance, eligibility, account responsibility, license, purchases, AI/output limitations, user content, acceptable use, IP, service changes, disclaimers, liability limits, governing law, changes, and contact when relevant.
- For AI features, state that outputs may be inaccurate and users remain responsible for reviewing decisions.
- For reminders or notifications, state they are convenience features and delivery is not guaranteed.

## Source And Review Hygiene

- Browse or fetch current official documentation when the user asks about current legal/platform requirements or when requirements are likely to change.
- Prefer official platform, regulator, or provider sources over generic legal-template websites.
- Do not provide long copied excerpts; summarize sources and cite them when sources were used.
- Recommend qualified legal review before publication or store submission.

## Output Expectations

Summarize:

- page type drafted or updated
- key product facts used
- assumptions and placeholders
- legal-review caveat
- source checks performed when applicable
- implementation or publication gaps, if any

## Initial Instruction Template

Use this prompt when drafting legal pages:

```text
Use $okan-legal-page-drafting-agent to draft this app or website legal page. Inspect the current product behavior, existing policies, data flows, payments, AI features, notifications, account model, provider details, and support contact before drafting. Produce original plain-language copy, mark placeholders and assumptions clearly, avoid compliance guarantees, and state that the draft needs qualified legal review.
```
