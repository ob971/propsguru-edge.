export type Confidence = "high" | "medium" | "low" | "unknown";
export type Game = {
  id: string;
  sport: string;
  homeTeam: string;
  awayTeam: string;
  homeAbbr: string;
  awayAbbr: string;
  startsAt: string | null;
  status: string;
};
export type LinePoint = { timestamp: string; line: number };
export type Prop = {
  id: string;
  gameId: string;
  player: string;
  team: string;
  market: string;
  side: "over" | "under";
  line: number;
  projection: number | null;
  probability: number | null;
  odds: number | null;
  edge: number | null;
  confidence: Confidence;
  updatedAt: string | null;
  history: LinePoint[];
};
export type Dataset = {
  label: string;
  demo: boolean;
  games: Game[];
  props: Prop[];
  warnings: string[];
};
const record = (v: unknown): Record<string, unknown> =>
  v !== null && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {};
const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const num = (v: unknown) =>
  typeof v === "number" && Number.isFinite(v) ? v : null;
const date = (v: unknown) =>
  typeof v === "string" && Number.isFinite(Date.parse(v)) ? v : null;
export function parseDataset(input: unknown): Dataset {
  const raw = record(input);
  if (!Array.isArray(raw.games) || !Array.isArray(raw.props))
    throw new Error(
      "This file needs games and props arrays. Download the example to see the supported schema.",
    );
  const warnings: string[] = [];
  const gameIds = new Set<string>();
  const propIds = new Set<string>();
  const games = raw.games.flatMap((value, index): Game[] => {
    const g = record(value);
    const id = str(g.id);
    if (!id || !str(g.homeTeam) || !str(g.awayTeam) || gameIds.has(id)) {
      warnings.push(
        `Game ${index + 1}: missing required fields or duplicate ID; skipped.`,
      );
      return [];
    }
    gameIds.add(id);
    return [
      {
        id,
        sport: str(g.sport) || "Other",
        homeTeam: str(g.homeTeam),
        awayTeam: str(g.awayTeam),
        homeAbbr: str(g.homeAbbr) || str(g.homeTeam).slice(0, 3).toUpperCase(),
        awayAbbr: str(g.awayAbbr) || str(g.awayTeam).slice(0, 3).toUpperCase(),
        startsAt: date(g.startsAt),
        status: str(g.status) || "scheduled",
      },
    ];
  });
  const props = raw.props.flatMap((value, index): Prop[] => {
    const p = record(value);
    const id = str(p.id);
    const line = num(p.line);
    if (
      !id ||
      propIds.has(id) ||
      !gameIds.has(str(p.gameId)) ||
      !str(p.player) ||
      !str(p.market) ||
      line === null ||
      !["over", "under"].includes(str(p.side).toLowerCase())
    ) {
      warnings.push(
        `Prop ${index + 1}: missing required fields, unknown game, or duplicate ID; skipped.`,
      );
      return [];
    }
    propIds.add(id);
    const probability = num(p.probability);
    const odds = num(p.odds);
    if (probability !== null && (probability < 0 || probability > 1))
      warnings.push(`${id}: probability must be between 0 and 1; omitted.`);
    const history = Array.isArray(p.history)
      ? p.history
          .flatMap((value): LinePoint[] => {
            const h = record(value);
            const timestamp = date(h.timestamp);
            const line = num(h.line);
            return timestamp && line !== null ? [{ timestamp, line }] : [];
          })
          .sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp))
      : [];
    return [
      {
        id,
        gameId: str(p.gameId),
        player: str(p.player),
        team: str(p.team) || "Team unavailable",
        market: str(p.market),
        side: str(p.side).toLowerCase() as Prop["side"],
        line,
        projection: num(p.projection),
        probability:
          probability !== null && probability >= 0 && probability <= 1
            ? probability
            : null,
        odds: odds !== null && Math.abs(odds) >= 100 ? odds : null,
        edge: num(p.edge),
        confidence: ["high", "medium", "low"].includes(
          str(p.confidence).toLowerCase(),
        )
          ? (str(p.confidence).toLowerCase() as Confidence)
          : "unknown",
        updatedAt: date(p.updatedAt),
        history,
      },
    ];
  });
  return {
    label: str(raw.label) || "Imported dataset",
    demo: raw.demo === true,
    games,
    props,
    warnings,
  };
}
export const confidenceRank = (c: Confidence) =>
  ({ high: 3, medium: 2, low: 1, unknown: 0 })[c];
export const isOpportunity = (p: Prop) => p.edge !== null && p.edge > 0;
export const isStrong = (p: Prop) =>
  (p.edge ?? -Infinity) >= 5 && p.confidence === "high";
export type Sort =
  "edge" | "probability" | "confidence" | "difference" | "updated";
export function rankProps(props: Prop[], sort: Sort = "edge") {
  const score = (p: Prop) =>
    sort === "probability"
      ? (p.probability ?? -Infinity)
      : sort === "confidence"
        ? confidenceRank(p.confidence)
        : sort === "difference"
          ? p.projection === null
            ? -Infinity
            : (p.projection - p.line) * (p.side === "over" ? 1 : -1)
          : sort === "updated"
            ? p.updatedAt
              ? Date.parse(p.updatedAt)
              : -Infinity
            : (p.edge ?? -Infinity);
  return [...props].sort(
    (a, b) =>
      score(b) - score(a) ||
      confidenceRank(b.confidence) - confidenceRank(a.confidence) ||
      (b.probability ?? -1) - (a.probability ?? -1) ||
      a.id.localeCompare(b.id),
  );
}
export const value = (n: number | null) =>
  n === null
    ? "—"
    : Number.isInteger(n)
      ? String(n)
      : String(Number(n.toFixed(2)));
export const signed = (n: number | null) =>
  n === null ? "—" : `${n > 0 ? "+" : ""}${value(n)}`;
export const percent = (n: number | null) =>
  n === null ? "—" : `${value(n * 100)}%`;
export const edgeText = (n: number | null) =>
  n === null ? "—" : `${signed(n)}%`;
export const impliedProbability = (odds: number | null) =>
  odds === null ? null : odds < 0 ? -odds / (-odds + 100) : 100 / (odds + 100);
export const shortDate = (date: string | null) =>
  date
    ? new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      }).format(new Date(date))
    : "Date unavailable";
export const time = (date: string | null) =>
  date
    ? new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: "UTC",
      }).format(new Date(date))
    : "Time TBD";
export const stamp = (date: string | null) =>
  date ? `${shortDate(date)}, ${time(date)} UTC` : "Update unavailable";
export const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join("");
