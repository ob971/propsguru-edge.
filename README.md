# Propsguru Edge

A responsive sports analytics workspace for discovering and understanding model-backed player props. Built with Next.js App Router, React, TypeScript, Tailwind CSS, shadcn/ui-style Radix primitives, Recharts, and Framer Motion.

## Application and source code

- **Deployed application:** [Propsguru Edge on Vercel](https://propsguru-edge.vercel.app/)
- **Source code:** [ob971/propsguru-edge. on GitHub](https://github.com/ob971/propsguru-edge.)
- **Handoff document:** [Propsguru Edge project handoff](docs/Propsguru-Edge-Handoff.docx)

The repository name ends with a period. The clone URL therefore contains two periods before `git`. If the repository is private, reviewers need repository access or a source-code ZIP.

## Review the experience

Start in **Opportunities** to scan the positive-edge board. Use **Games** to explore a matchup or **All props** to include negative-edge and incomplete records. Search for a player, filter by market or confidence, and open **View analysis** for projections, odds, probability, and line history. Save a prop and find it again under **Saved props**. **Data source** accepts a compatible local JSON file and provides an example schema.

## Run locally

Requires Node.js 22.9+ and npm.

Clone the repository into a folder without the trailing period, then install the locked dependencies:

```sh
git clone https://github.com/ob971/propsguru-edge..git propsguru-edge
cd propsguru-edge
npm ci
npm run dev
```

If you already have the source ZIP, extract it and run `npm ci` and `npm run dev` from the folder containing `package.json`. No environment variables, backend, or API keys are required. Stop the development server with Ctrl+C.

Open http://localhost:3000. To check the project:

```sh
npm run typecheck
npm test
npm run build
```

The production build is a static export in `out/`. The deployed app is hosted on Vercel. To preview `out/` locally, use a static file server rather than `next start`. Building the project writes local files; publication is a separate action.

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
- `src/lib/odds.ts`: compares odds between matching selections in successive snapshots.
- `tests/data.test.ts` and `tests/odds.test.ts`: validation, ranking, missing-value, history, and odds-change tests.

No backend, authentication layer, betting functionality, or external sports service is part of this application.

## Trade-offs and next steps

The original JSON still needs validation against the parser. The current application uses a clearly labeled illustrative fixture.

I would prioritize improvements that make recommendations easier to trust, the experience easier to share, and the application more reliable.

### Validate the original dataset

My first step would be testing the application against the original JSON and confirming how each field should be interpreted. I would verify whether probabilities use decimals or percentages, how confidence is represented, and whether edge is supplied directly or requires calculation.

I would expand coverage for duplicate records, missing odds, inconsistent timestamps, and incomplete line history. This would help ensure that unusual data never produces a misleading recommendation.

### Add shareable prop links and preserve filters

Each prop would have its own URL so users could share a specific analysis or return to it later. I would also store search, filters, and sorting in the URL.

This would let someone share a view such as NBA points props with high confidence and at least five percentage points of edge. Refreshing the page or using the browser Back button would preserve their browsing context.

### Explain freshness and changing recommendations

The application currently displays snapshot timestamps. I would make it easier to distinguish a recent snapshot from older information, using freshness rules appropriate to the dataset.

When a new snapshot is loaded, I would show which saved props changed, including their previous and current odds, lines, or projections. If a saved selection disappeared, I would explain that it is no longer available in the current dataset. This would help users understand changes without implying that the app has a live feed.

### Expand accessibility and interaction testing

I would add automated tests for complete journeys: finding a prop, applying filters, opening analysis, saving a selection, and importing another dataset.

I would also test with screen readers, keyboard-only navigation, reduced-motion settings, and physical mobile devices. Particular attention would go to dialog focus, chart descriptions, touch targets, and announcing updates without overwhelming the user.

### Improve performance with larger datasets

The current dataset is small. I would test with thousands of props and measure filtering, sorting, rendering, and scrolling performance.

Based on those results, I would introduce pagination or virtualization, optimize repeated calculations, and defer expensive search updates where necessary. The goal would be to keep browsing responsive as the amount of data grows.

### Refine the experience through user feedback

I would observe sports fans completing realistic tasks and identify where they hesitate or misunderstand the information. That would help determine whether labels, ranking explanations, filters, and analysis views need refinement.

I would also add local-time display with a clear timezone label, making game schedules easier to understand while retaining precise timestamps.

My first priorities would be dataset validation and stronger testing, followed by shareable links and clearer snapshot changes. Those improvements would deliver the most immediate gains in accuracy, reliability, and everyday usefulness.

## Motion and interaction decisions

Sportsbook research informed the interaction structure: [DraftKings’ selection and bet-slip workflow](https://support.draftkings.com/dk/en-us/how-do-i-place-a-bet-on-draftkings-sports-betting?id=kb_article_view&sysparm_article=KB0010423) inspired immediate, persistent saved-selection feedback, while [FanDuel’s documented odds-change notices](https://www.fanduel.com/fanduel-sportsbook-house-rules-ny) informed explicit snapshot-change feedback. These patterns are adapted to an analytics workspace; saving remains a bookmark action.

- Shared Framer Motion indicators follow desktop/mobile navigation and sport selection. Sections enter in 200 ms, cards reorder in place, and only the first four cards receive a short entrance stagger (at most 75 ms).
- Pointer hover and button press feedback are subtle; saved cards retain a border and checkmark. Accessible, dismissible confirmations announce saves and imports.
- Radix dialogs animate both opening and closing. Mobile analysis/filter sheets use a short vertical transition, and analysis returns keyboard focus after dismissal. Projection/probability bars reveal once without animating the actual numeric values.
- JSON reading exposes a real busy state without an artificial loading delay. On import, changed odds briefly highlight and retain a directional arrow; the accessible label/tooltip includes the preceding value. Comparison requires the same game identity/date, player, market, side, and line. Missing odds and a different line never create a false price-change notice. No live feed is simulated.
- `prefers-reduced-motion` disables entrances, layout motion, glyph animation, CSS transitions, and hover/press displacement. Most motion uses transforms and opacity, and interactions apply immediately without waiting for exits.

Motion durations live in `src/components/ui/motion-feedback.tsx` and the interaction styles near the end of `src/app/globals.css`. Odds comparison is isolated in `src/lib/odds.ts` with regression coverage.

## Verification

The following checks were completed on the local implementation before this documentation update; they are not a separate audit of the Vercel deployment.

- Production static export built successfully.
- TypeScript strict type checking passed.
- All 12 automated tests passed, including snapshot odds comparison.
- Browser checks passed at 1440px desktop and 390px mobile widths: search, empty-state recovery, section navigation, filter sheet, saved-prop persistence after reload, analysis dismissal, missing-value handling, and conflicting-signal messaging.
- No horizontal page overflow at the tested widths and no browser console warnings or errors during the checked flows.
- Animation update: verified mobile sport filtering, desktop/mobile dialog dismissal and focus return, saved confirmation, and a local JSON import changing odds from +105 to +115. The marker exposed the correct prior-value label, and the tested mobile analysis had no horizontal overflow. Reduced-motion paths were reviewed in code; OS-level preference switching was not exercised.
- These are browser viewport checks, not a full physical-device or assistive-technology audit.
