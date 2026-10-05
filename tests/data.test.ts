import assert from "node:assert/strict";
import test from "node:test";
import fixture from "../src/data/demo.json";
import {
  parseDataset,
  rankProps,
  impliedProbability,
  isStrong,
  isOpportunity,
} from "../src/lib/data";
test("demo fixture is explicitly labeled and all associations resolve", () => {
  const d = parseDataset(fixture);
  assert.equal(d.demo, true);
  assert.equal(d.warnings.length, 0);
  assert.equal(d.props.length, 16);
  assert.equal(d.games.length, 5);
});
test("isolates malformed records without discarding valid props", () => {
  const d = parseDataset({
    ...fixture,
    props: [
      ...fixture.props,
      null,
      { ...fixture.props[0], id: "orphan", gameId: "missing" },
      { ...fixture.props[0] },
    ],
  });
  assert.equal(d.props.length, 16);
  assert.equal(d.warnings.length, 3);
});
test("preserves zero edge and distinguishes missing values from zero", () => {
  const d = parseDataset(fixture);
  const zero = d.props.find((p) => p.edge === 0)!;
  assert.ok(zero);
  assert.equal(isOpportunity(zero), false);
  assert.equal(
    d.props.find((p) => p.player === "Mikal Bridges")?.projection,
    null,
  );
});
test("rejects malformed roots and preserves empty datasets", () => {
  assert.throws(() => parseDataset({}), /games and props/);
  assert.deepEqual(parseDataset({ games: [], props: [] }).props, []);
});
test("normalizes confidence and orders only valid historical observations", () => {
  const d = parseDataset({
    ...fixture,
    props: [
      {
        ...fixture.props[0],
        confidence: "HIGH",
        probability: 70,
        history: [
          { line: 28, timestamp: "2026-10-05T12:00:00Z" },
          { line: 27, timestamp: "2026-10-05T10:00:00Z" },
          { line: "bad", timestamp: "invalid" },
        ],
      },
    ],
  });
  assert.equal(d.props[0].probability, null);
  assert.equal(d.props[0].confidence, "high");
  assert.deepEqual(
    d.props[0].history.map((h) => h.line),
    [27, 28],
  );
  assert.equal(d.warnings.length, 1);
});
test("ranking is deterministic, non-mutating, and null values sort last", () => {
  const d = parseDataset(fixture);
  const before = d.props.map((p) => p.id);
  const ranked = rankProps(d.props);
  assert.deepEqual(
    d.props.map((p) => p.id),
    before,
  );
  assert.equal(ranked[0].edge, 12.2);
  assert.equal(ranked.at(-1)?.edge, null);
  assert.equal(rankProps(d.props, "probability").at(-1)?.probability, null);
});
test("strong signals require both high confidence and sufficient supplied edge", () => {
  const p = parseDataset(fixture).props[0];
  assert.equal(isStrong(p), true);
  assert.equal(isStrong({ ...p, confidence: "low" }), false);
  assert.equal(isStrong({ ...p, edge: 4.9 }), false);
});
test("American odds convert correctly without treating missing odds as zero", () => {
  assert.ok(Math.abs(impliedProbability(-110)! - 110 / 210) < 1e-10);
  assert.equal(impliedProbability(100), 0.5);
  assert.equal(impliedProbability(150), 0.4);
  assert.equal(impliedProbability(null), null);
});
test("directional projection difference respects unders", () => {
  const p = parseDataset(fixture).props[0];
  const under = {
    ...p,
    id: "under",
    side: "under" as const,
    line: 20,
    projection: 15,
  };
  const over = {
    ...p,
    id: "over",
    side: "over" as const,
    line: 20,
    projection: 23,
  };
  assert.equal(rankProps([over, under], "difference")[0].id, "under");
});
