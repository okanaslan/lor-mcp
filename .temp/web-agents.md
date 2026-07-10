# Web Agent Instructions

Use this file with root `AGENTS.md` for browser React work.

## Stack Rules

- Prefer the project's established React, Vite, Vitest, Tailwind CSS, ESLint,
  Prettier, and package-manager conventions.
- Treat Figma as the source for visual tokens and component states.
- Keep data fetching, state, and presentation boundaries clear.
- Keep server state in the project's established query or cache tooling instead
  of adding ad hoc effect-driven fetching.
- Reuse existing components and styles before adding new patterns.
- Implement relevant hover, focus, disabled, loading, selected, empty, and error
  states.
- Keep UI responsive and accessible.
- Ask before adding UI frameworks, styling systems, state libraries, data
  clients, provider SDKs, generators, or deployment tools.

## Relevant Skills

- `okan-frontend-marketing-website-agent`: public-facing React websites.
- `okan-figma-to-react-implementation-agent`: translate Figma into browser React.
- `okan-tailwindcss-usage-agent`: review or fix Tailwind CSS usage.
- `okan-react-accessibility-review-agent`: audit or remediate accessibility.
- `okan-seo-landing-page-agent`: plan, implement, or audit SEO pages.
- `vercel-react-best-practices`: review React or Next.js performance patterns.
- Skills do not expand folder ownership or dependency approval.

## Boundaries

- Follow the project's existing entrypoint, routes, components, styles, and test
  organization.
- Keep environment variables limited to values the frontend actually consumes.
- Keep tests beside the code they verify when local conventions allow it.
- Document environment variables safely and never commit secrets.
- Do not commit build output, coverage, or local environment files.

## Verification

- Identify the local package-manager scripts before editing.
- Run focused tests, linting, type checks, and builds when relevant.
- Before handoff, run the project's strongest available check.
- For UI changes, verify responsive layout, interaction states, accessibility,
  and fidelity to the design source.
