import assert from "node:assert/strict";
import test from "node:test";
import fixture from "../src/data/demo.json";
import { parseDataset } from "../src/lib/data";
import { changedOdds } from "../src/lib/odds";

const before = parseDataset(fixture);

test("highlights changed odds on the same selection, even when source IDs change", () => {
  const after = structuredClone(before);
  const p = after.props[0];
  const old = p.odds!;
  p.odds = old === -120 ? -130 : -120;
  p.id = "replacement-id";
  assert.deepEqual(changedOdds(before, after), { [p.id]: old });
  assert.deepEqual(changedOdds(after, after), {});
});

test("does not compare missing odds or different betting selections", () => {
  for (const patch of [
    { odds: null },
    { odds: -120, line: 99 },
    { odds: -120, player: "Different player" },
    { odds: -120, side: "under" as const },
  ]) {
    const after = structuredClone(before);
    Object.assign(after.props[0], patch);
    assert.deepEqual(changedOdds(before, after), {});
  }
  const missing = structuredClone(before);
  missing.props[0].odds = null;
  assert.deepEqual(changedOdds(missing, before), {});
});

test("a reused game ID on a new date does not signal an odds update", () => {
  const after = structuredClone(before);
  after.props[0].odds = -120;
  after.games.find((g) => g.id === after.props[0].gameId)!.startsAt =
    "2027-10-05T20:00:00Z";
  assert.deepEqual(changedOdds(before, after), {});
});
