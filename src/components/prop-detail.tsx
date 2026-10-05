"use client";
import {
  Bookmark,
  ArrowUpRight,
  ArrowDownRight,
  ChartNoAxesCombined,
  Info,
  MoveRight,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ConfidenceBadge, EdgeBadge } from "@/components/prop-card";
import {
  type Prop,
  type Game,
  value,
  signed,
  percent,
  impliedProbability,
  initials,
  stamp,
  time,
} from "@/lib/data";
export default function PropDetail({
  prop: p,
  game,
  open,
  onClose,
  saved,
  onSave,
}: {
  prop: Prop | null;
  game: Game | undefined;
  open: boolean;
  onClose: () => void;
  saved: boolean;
  onSave: () => void;
}) {
  if (!p || !game) return null;
  const delta = p.projection === null ? null : p.projection - p.line;
  const implied = impliedProbability(p.odds);
  const conflict = delta !== null && delta * (p.side === "over" ? 1 : -1) < 0;
  const domain =
    p.projection === null
      ? Math.max(p.line * 1.3, 1)
      : Math.max(p.projection, p.line) * 1.25 || 1;
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="analysis-dialog">
        <div className="detail-scroll">
          <div className="detail-kicker">
            <ChartNoAxesCombined size={15} /> THE SIGNAL, EXPLAINED
          </div>
          <div className="detail-player">
            <span className={`avatar big team-${p.team.toLowerCase()}`}>
              {initials(p.player)}
            </span>
            <div>
              <DialogTitle>{p.player}</DialogTitle>
              <DialogDescription>
                {game.awayTeam} @ {game.homeTeam}
                <br />
                {stamp(game.startsAt)}
              </DialogDescription>
            </div>
          </div>
          <div className="detail-pick">
            <div>
              <span className="eyebrow">{p.market}</span>
              <h2>
                {p.side === "over" ? "Over" : "Under"} {value(p.line)}
                <small>{signed(p.odds)}</small>
              </h2>
              <ConfidenceBadge confidence={p.confidence} />
            </div>
            <div className="detail-edge">
              <EdgeBadge edge={p.edge} />
              <span>MODEL EDGE</span>
            </div>
          </div>
          <section className="analysis-section">
            <h3>
              Model meets market <span>01</span>
            </h3>
            <div className="comparison-numbers">
              <div>
                <span>Model projection</span>
                <strong className="lime-text">{value(p.projection)}</strong>
              </div>
              <MoveRight size={23} />
              <div>
                <span>Market line</span>
                <strong>{value(p.line)}</strong>
              </div>
              <div className="difference">
                <span>Difference</span>
                <strong>{signed(delta)}</strong>
              </div>
            </div>
            <div className="comparison-bars">
              <div>
                <span>MODEL</span>
                <i
                  style={{
                    width: `${Math.max(0, ((p.projection ?? 0) / domain) * 100)}%`,
                  }}
                />
              </div>
              <div>
                <span>MARKET</span>
                <i
                  style={{ width: `${Math.max(0, (p.line / domain) * 100)}%` }}
                />
              </div>
            </div>
            <p className="muted">
              Projection difference uses the units of this market.
            </p>
          </section>
          <div className="detail-metrics">
            <div>
              <span>Model probability</span>
              <strong>{percent(p.probability)}</strong>
              <div className="probability-track">
                <i style={{ width: `${(p.probability ?? 0) * 100}%` }} />
              </div>
            </div>
            <div>
              <span>Odds-implied probability</span>
              <strong>{percent(implied)}</strong>
              <small>
                {p.odds === null
                  ? "Odds not supplied"
                  : "From " + signed(p.odds) + " American odds · includes vig"}
              </small>
            </div>
          </div>
          <section className="signal-explainer">
            <span className="signal-icon">
              <ChartNoAxesCombined size={19} />
            </span>
            <div>
              <h3>
                {conflict
                  ? "A mixed model signal"
                  : p.edge !== null && p.edge > 0
                    ? "Why this stands out"
                    : "Read the signal carefully"}
              </h3>
              <p>
                {p.projection === null
                  ? "No model projection is available for this prop."
                  : `The model projects ${value(p.projection)} ${p.market.toLowerCase()} against a ${value(p.line)} market line, a ${value(Math.abs(delta!))} ${delta === 0 ? "unit difference" : delta! > 0 ? "unit increase" : "unit decrease"}.`}{" "}
                {p.edge !== null
                  ? `The supplied model edge is ${signed(p.edge)} percentage points on the ${p.side}.`
                  : "No edge was supplied."}{" "}
                {conflict
                  ? "The projection leans against the recommended side; review both signals before drawing a conclusion."
                  : ""}
              </p>
            </div>
          </section>
          <section className="analysis-section">
            <h3>
              Follow the line <span>02</span>
            </h3>
            <div className="chart-caption">
              <span>
                <i /> Market line
              </span>
              <span className="muted">All times UTC</span>
            </div>
            {p.history.length > 0 ? (
              <>
                <div
                  className="line-chart"
                  role="img"
                  aria-label={`Historical ${p.market} line, from ${p.history[0].line} to ${p.history[p.history.length - 1].line}. Current line ${p.line}.`}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={p.history.map((h) => ({
                        ...h,
                        timestamp: Date.parse(h.timestamp),
                      }))}
                      margin={{ top: 15, right: 12, bottom: 8, left: -18 }}
                    >
                      <CartesianGrid
                        stroke="#29312c"
                        vertical={false}
                        strokeDasharray="3 6"
                      />
                      <XAxis
                        dataKey="timestamp"
                        type="number"
                        domain={["dataMin", "dataMax"]}
                        tickFormatter={(v) => time(new Date(v).toISOString())}
                        stroke="#7b877e"
                        fontSize={10}
                        minTickGap={40}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        domain={["auto", "auto"]}
                        stroke="#7b877e"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals
                      />
                      <Tooltip
                        labelFormatter={(v) =>
                          stamp(new Date(Number(v)).toISOString())
                        }
                        formatter={(v) => [v, "Market line"]}
                        contentStyle={{
                          background: "#202722",
                          border: "1px solid #3c463e",
                          borderRadius: 10,
                          color: "#f4f6f0",
                        }}
                      />
                      <ReferenceLine
                        y={p.line}
                        stroke="#92a18e"
                        strokeDasharray="4 4"
                        label={{
                          value: "Current",
                          position: "insideTopRight",
                          fill: "#9ca89e",
                          fontSize: 10,
                        }}
                      />
                      <Line
                        type="stepAfter"
                        dataKey="line"
                        stroke="#c1ed83"
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: "#c1ed83", strokeWidth: 0 }}
                        activeDot={{ r: 5 }}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p className="movement-note">
                  {p.history.length > 1 ? (
                    <>
                      {p.history[p.history.length - 1].line <
                      p.history[0].line ? (
                        <ArrowDownRight size={15} />
                      ) : (
                        <ArrowUpRight size={15} />
                      )}{" "}
                      The recorded line moved from{" "}
                      <b>{value(p.history[0].line)}</b> to{" "}
                      <b>{value(p.history[p.history.length - 1].line)}</b>{" "}
                      across {p.history.length} observations.
                    </>
                  ) : (
                    <>
                      One historical observation is available; no trend can be
                      inferred.
                    </>
                  )}
                </p>
                <details className="history-table">
                  <summary>View historical values</summary>
                  <table>
                    <thead>
                      <tr>
                        <th>Time (UTC)</th>
                        <th>Line</th>
                      </tr>
                    </thead>
                    <tbody>
                      {p.history.map((h, i) => (
                        <tr key={`${h.timestamp}-${i}`}>
                          <td>{stamp(h.timestamp)}</td>
                          <td>{value(h.line)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </details>
              </>
            ) : (
              <div className="chart-empty">
                <ArrowDownRight />
                <p>No historical line data supplied for this prop.</p>
              </div>
            )}
          </section>
          <div className="detail-footnote">
            <Info size={15} />
            <p>
              Edge is the supplied model estimate in percentage points, not a
              promised return. Confidence is a model label, not a win
              probability. Updated {stamp(p.updatedAt)}.
            </p>
          </div>
        </div>
        <div className="detail-actions">
          <span>Keep this signal on your radar.</span>
          <Button onClick={onSave} variant={saved ? "outline" : "default"}>
            <Bookmark size={16} fill={saved ? "currentColor" : "none"} />
            {saved ? "Saved to your list" : "Save prop"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
