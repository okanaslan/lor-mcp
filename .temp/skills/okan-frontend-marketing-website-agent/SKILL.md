---
name: okan-frontend-marketing-website-agent
description: Frontend implementation skill for public-facing React marketing websites and informational app sites. Use when Codex needs to build or improve landing pages, SEO pages, launch pages, app store-link pages, legal or policy pages, public product pages, static content sections, metadata, social previews, favicons, sitemaps, or marketing website polish. Do not use for authenticated product dashboards, backend work, React Native app screens, Figma-only design work, or broad PM planning.
---

# Frontend Marketing Website Agent

Use this skill for implementing and improving public-facing React websites that explain, market, or support a product.

## Operating Model

- Read the project and nearest `AGENTS.md` files before changing frontend code.
- Inspect the current stack, routing approach, design tokens, typography, assets, tests, and build scripts.
- Keep implementation inside the frontend-owned area unless the user explicitly expands scope.
- Reuse existing components, tokens, CSS conventions, content style, and asset pipelines before adding new structure.
- Apply relevant React, framework, and documentation skills required by the target repo.

## Scope

Use this skill for:

- Marketing homepages, launch pages, app landing pages, and product info pages.
- SEO content sections, FAQ blocks, feature sections, store-link sections, and public copy updates.
- Static legal, policy, contact, support, release, or informational pages.
- Metadata, Open Graph, Twitter card, favicon, manifest, sitemap, and robots improvements.
- Responsive layout polish for mobile and desktop public pages.
- Static Vite or React sites where the web presence supports a mobile or external product.

Do not use this skill for:

- Authenticated app dashboards, admin panels, data-heavy tools, or internal product UX.
- Backend APIs, persistence, migrations, or service integrations.
- React Native mobile app screens.
- Figma-only design creation or design-system curation.
- Broad PM planning, roadmap work, or store screenshot design.

## Implementation Rules

- Treat the website as a public communication surface: be accurate, concrete, and easy to scan.
- Do not imply unsupported product functionality, availability, pricing, platform support, or compliance status.
- If the product is mobile-only, avoid building web-app affordances or copy that suggests a browser product exists.
- Prefer mobile-first layout with desktop enhancements through progressive breakpoints.
- Use semantic HTML, accessible links and buttons, meaningful alt text, visible focus states, and readable heading structure.
- Keep static content data outside components when it improves clarity or testability.
- Use real product assets, approved brand marks, or generated/imported assets through the project asset pipeline.
- Keep metadata and share previews aligned with the visible page promise.
- For placeholder legal or store links, make the placeholder state visible and accessible.

## Content And SEO Rules

- Lead with the product name or clear category, then explain the concrete user value.
- Prefer specific feature language over generic productivity or growth claims.
- Add SEO copy only where it still reads naturally to a human visitor.
- Keep FAQ answers short, honest, and aligned with current product behavior.
- Include canonical URLs, structured data, sitemap, robots, favicon, manifest, and social metadata when the project supports them.
- Flag any legal, privacy, health, finance, subscription, or AI claims that need owner or lawyer review.

## Verification Expectations

- Run the frontend validation scripts that exist, typically typecheck, lint, format check, tests, and build.
- Update or add tests for public behavior: headings, links, store cards, legal links, FAQ content, metadata generators, and route selection.
- For significant visual changes, inspect at least one small and one desktop viewport unless the user explicitly skips visual validation.
- Check for horizontal scrolling, clipping, overlapping text, broken images, poor focus states, and inaccessible placeholder links.
- Report changed areas, validation results, skipped checks, and assumptions.

## Output Expectations

Summarize:

- public-site behavior changed
- SEO or metadata impact
- accessibility and responsive considerations
- validation performed
- remaining content, legal, asset, or deployment assumptions

## Initial Instruction Template

Use this prompt in a frontend marketing website project:

```text
Use $okan-frontend-marketing-website-agent to implement this public React marketing website change. Inspect the current frontend stack, AGENTS.md rules, design tokens, assets, metadata, and tests before editing. Keep the site accurate, responsive, accessible, SEO-aware, and aligned with the real product scope. Reuse existing components and run the available frontend checks before summarizing results.
```
