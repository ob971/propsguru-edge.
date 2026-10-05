# Propsguru Edge

A responsive sports analytics workspace for discovering and understanding model-backed player props. Built with Next.js App Router, React, TypeScript, Tailwind CSS, shadcn/ui-style Radix primitives, Recharts, and Framer Motion.

## Run locally

Requires Node.js 22.9+ and npm.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. To check the project:

```sh
npm run typecheck
npm test
npm run build
```

The production build is a static export in `out/`. Serve that directory with any static host (Vercel, Cloudflare Pages, Netlify, or Sites). Because this project uses static export, use a static file server to preview `out/`, rather than `next start`.

## Important data note

The supplied attachment contained the product brief, but **no original JSON dataset**. The app therefore ships with a prominently labeled illustrative fixture in `src/data/demo.json`. Games, schedules, lines, probabilities, and recommendations in that fixture are fictional; they are not current sports data. No live sports API is used.

Use **Data source → Choose JSON file** to load a compatible dataset locally. `public/example-data.json` documents the exact schema and is downloadable from the UI. Imports last for the browser session and are never uploaded. Replacing the fixture and rebuilding makes a dataset permanent. The original dataset's exact schema and scenarios still need verification when that file is supplied.

### Data contract

Root: `{ label?: string, demo?: boolean, games: Game[], props: Prop[] }`.

- Games require unique `id`, `homeTeam`, `awayTeam`. Optional: `sport`, `homeAbbr`, `awayAbbr`, ISO `startsAt`, `status`.
- Props require unique `id`, a known `gameId`, `player`, `market`, `side` (`over` or `under`), and numeric `line`.
- Optional: `team`, `projection`, `probability` (0–1), `odds` (American, magnitude >=100), `edge` (percentage points), `confidence` (`high`, `medium`, `low`), ISO `updatedAt`, `history: { timestamp, line }[]`.
- The parser isolates invalid records and displays quality notes. Missing optional values stay missing (shown as “—”), never zero. Invalid probabilities are omitted with a note. Historical observations are validated and chronologically sorted. The import size limit is 5 MB.

## Product decisions

**Discovery first.** The default board includes positive-edge props, led by three cards and followed by a compact market list. All props, including negative edges and incomplete records, remain available in All props. Game cards lead directly to that matchup's props.

**Transparent ranking.** Default order is descending supplied edge, then confidence, then probability, with an ID tie-breaker. A “strong signal” means high confidence and edge >=5 percentage points. Users can instead sort by probability, confidence, directional projection difference, or update timestamp. Projection-difference sorting uses raw stat units; filtering to one market makes comparisons more meaningful.

**Explain before overwhelming.** The analysis dialog combines projection versus line, probability, odds-implied probability, confidence, dynamically written interpretation, and Recharts historical line movement. The supplied edge remains authoritative and is not silently recomputed. Mixed projection/recommendation signals are called out. Odds-implied probability includes sportsbook margin.

**Honest freshness.** The UI uses absolute UTC timestamps and identifies the snapshot. No fabricated live indicator, fake updating timer, or simulated loading delay. A route loading skeleton is available for real navigation loading.

**Built for the device.** Desktop has a persistent sidebar and compact board; mobile has bottom navigation, stacked cards, a filter sheet, and full-screen prop analysis. Dialog primitives handle focus trapping, dismissal, and keyboard interaction. Reduced-motion preferences are respected. Chart history also has an accessible table.

## Extras

- Browser-local saved props, with stable keys describing the game/player/market/side/line.
- JSON import and downloadable example, allowing reviewers to exercise other data scenarios.
- Search across players, teams, matchups, and markets; Cmd/Ctrl+K focuses search.
- Missing data, empty results, zero/negative edge, conflicting projections, absent odds, and missing history states.
- Dynamic methodology and data-source explanations.

## Architecture

- `src/lib/data.ts`: types, parser, formatting, ranking, and derived metrics.
- `src/components/workspace.tsx`: navigation, filters, import, and browser state.
- `src/components/prop-card.tsx`: reusable opportunity card and metric badges.
- `src/components/prop-detail.tsx`: deeper analysis and line movement chart.
- `src/components/ui`: locally owned shadcn/ui-pattern Button and Radix Dialog primitives.
- `src/app`: static App Router page, layout, loading/error boundaries, responsive design tokens and styles. Tailwind utilities and custom component CSS share one stylesheet.
- `tests/data.test.ts`: validation, ranking, missing-value, history, and odds tests.

No backend, authentication layer, betting functionality, or external sports service is part of this application.

## Trade-offs and next steps

The missing original JSON is the primary limitation. First adapt and verify its schema, probability units, confidence scale, and edge semantics. Next add URL-persisted filters and direct prop links, automated accessibility checks, screen-reader testing, and broader real-device coverage. Large datasets would benefit from pagination and deferred search. Localization and viewer-timezone controls would be useful beyond the current explicit UTC display.

The deployed Sites audience defaults to owner-private. Reviewers need an explicitly configured sharing audience before the link becomes accessible to them.

## Verification

- Production static export built successfully.
- TypeScript strict type checking passed.
- All nine automated data tests passed.
- Browser checks passed at 1440px desktop and 390px mobile widths: search, empty-state recovery, section navigation, filter sheet, saved-prop persistence after reload, analysis dismissal, missing-value handling, and conflicting-signal messaging.
- No horizontal page overflow at the tested widths and no browser console warnings or errors during the checked flows.
- These are browser viewport checks, not a full physical-device or assistive-technology audit.
