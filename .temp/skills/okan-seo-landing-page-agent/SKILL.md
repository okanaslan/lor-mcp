---
name: okan-seo-landing-page-agent
description: SEO landing page skill for planning, writing, implementing, and auditing search-oriented public pages. Use when Codex needs to create or improve SEO landing pages, keyword-focused public pages, metadata, canonical URLs, structured data, FAQ sections, Open Graph or Twitter cards, sitemap or robots assets, internal links, crawlability, or landing-page SEO audits. Do not use for generic marketing implementation without SEO intent, App Store or Google Play listing copy, legal policy drafting, backend work, authenticated app pages, paid ads, or pure visual design.
---

# SEO Landing Page Agent

Use this skill when search visibility and public landing-page quality are central to the task.

## Operating Model

- Inspect the existing site before proposing SEO changes: routes, rendering model, metadata, headings, content, structured data, internal links, sitemap, robots, canonical URLs, social previews, analytics assumptions, and build/deploy setup.
- Understand the product facts and positioning before writing copy.
- Identify the search intent, target queries, page audience, and page purpose before changing content.
- Write useful human-readable content first; avoid keyword stuffing, doorway pages, thin pages, and unsupported claims.
- Keep claims aligned with actual product behavior, availability, pricing, platform support, privacy posture, and legal review status.
- Use current official SEO, platform, or framework documentation when guidance may have changed.

## Scope

Use this skill for:

- SEO landing pages, feature pages, use-case pages, comparison pages, launch pages, and public informational pages.
- Metadata improvements: title, meta description, canonical URL, robots tags, theme color, and language attributes.
- Open Graph, Twitter/X card, favicon, manifest, and social preview improvements.
- Structured data such as `WebSite`, `SoftwareApplication`, `FAQPage`, `Organization`, or `BreadcrumbList` when appropriate.
- Sitemap, robots, crawl asset generation, route inclusion, and canonical domain handling.
- SEO audits of landing-page content, headings, internal links, crawlability, and indexability.

Do not use this skill for:

- Generic public-site implementation where SEO is incidental.
- App Store or Google Play listing metadata and copy.
- Legal policy drafting or compliance wording.
- Authenticated application pages, dashboards, admin tools, or internal pages.
- Backend APIs, persistence, migrations, or service logic.
- Paid ads, campaign targeting, or pure visual design.

## SEO Workflow

1. Inspect current page and site structure: visible content, title, description, headings, links, images, metadata, structured data, crawl assets, and route generation.
2. Define target search intent and terms from product context and user direction. If no terms are provided, choose conservative product/category terms and record them as assumptions.
3. Strengthen page copy with clear sections that answer real user questions and connect benefits to actual features.
4. Add FAQ content only when it answers likely searcher questions and is accurate enough to support structured data.
5. Update metadata and social previews so search and share snippets match the visible page promise.
6. Add or revise structured data only when the page visibly supports the schema content.
7. Ensure sitemap, robots, canonical URLs, and environment-based site URLs are consistent with deployment assumptions.
8. Preserve accessibility, semantic heading order, meaningful alt text, readable text, and responsive layout quality.
9. Validate with available tests, build checks, and file/content assertions for metadata or generated crawl assets.

## Content And Claim Rules

- Prefer specific, concrete copy over generic “boost productivity” language.
- Keep one primary H1 per page and use headings to reflect the actual content hierarchy.
- Do not create fake reviews, fake ratings, fake availability, fake prices, fake awards, or unsupported comparisons.
- Do not imply a web app, platform availability, subscription state, privacy status, or compliance status unless confirmed.
- Use AI-related wording only when AI features exist or are explicitly planned, and avoid reliability guarantees.
- Keep legal, medical, financial, children, privacy, and safety claims conservative and flag them for review.

## Technical Rules

- Prefer static or build-time metadata when the project is a static site.
- Keep canonical and social URLs absolute and environment-aware when the project supports deployment configuration.
- Include public routes that should rank in the sitemap; exclude placeholders, private routes, and non-indexable pages.
- Keep structured data valid JSON-LD and consistent with visible content.
- Use stable public asset paths for favicon and social cards.
- Avoid adding heavy SEO libraries when simple project-native metadata or build scripts are sufficient.

## Verification Expectations

- Run available frontend checks, typically typecheck, lint, format check, tests, and build.
- Add or update tests for key headings, FAQ questions, internal links, metadata, structured data, sitemap, robots, or generator output when practical.
- Check generated files after build when the project generates `robots.txt`, `sitemap.xml`, static metadata, or social assets.
- For visual content changes, inspect mobile and desktop layouts unless the user explicitly skips visual validation.
- Report target intent, SEO assets changed, validation performed, skipped checks, and deployment assumptions.

## Output Expectations

Summarize:

- target search intent or keywords used
- content sections changed
- metadata and structured data impact
- sitemap, robots, canonical, or asset changes
- accessibility and responsive considerations
- validation performed and remaining assumptions

## Initial Instruction Template

Use this prompt for SEO landing page work:

```text
Use $okan-seo-landing-page-agent to improve this public landing page for SEO. Inspect the existing site structure, visible copy, metadata, structured data, sitemap, robots, canonical URLs, product claims, and validation scripts first. Align copy with search intent and real product behavior, avoid keyword stuffing or unsupported claims, update crawl/share assets where relevant, and verify with available checks.
```
