import type { Dataset, Prop } from "./data";

// A different line is a different selection, even if its source reuses an ID.
export const selectionKey = (p: Prop) =>
  JSON.stringify([p.gameId, p.player, p.market, p.side, p.line]);

export function changedOdds(
  before: Dataset,
  after: Dataset,
): Record<string, number> {
  const previous = new Map(before.props.map((p) => [selectionKey(p), p.odds]));
  const games = new Map(before.games.map((g) => [g.id, g]));
  const comparableGames = new Set(
    after.games
      .filter((g) => {
        const old = games.get(g.id);
        return (
          old &&
          old.homeTeam === g.homeTeam &&
          old.awayTeam === g.awayTeam &&
          old.startsAt === g.startsAt
        );
      })
      .map((g) => g.id),
  );
  const changes: Record<string, number> = {};
  for (const p of after.props) {
    const old = previous.get(selectionKey(p));
    if (
      comparableGames.has(p.gameId) &&
      old != null &&
      p.odds !== null &&
      old !== p.odds
    ) {
      changes[p.id] = old;
    }
  }
  return changes;
}
