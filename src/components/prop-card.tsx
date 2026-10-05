"use client";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Bookmark,
  ChevronRight,
  Clock3,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { motion } from "framer-motion";
import type { Game, Prop } from "@/lib/data";
import { edgeText, initials, percent, signed, stamp, value } from "@/lib/data";
export function ConfidenceBadge({
  confidence,
}: {
  confidence: Prop["confidence"];
}) {
  return (
    <span className={`confidence confidence-${confidence}`}>
      <span />
      {confidence === "unknown" ? "Unrated" : `${confidence} confidence`}
    </span>
  );
}
export function EdgeBadge({ edge }: { edge: number | null }) {
  return (
    <span
      className={`edge ${edge === null ? "neutral" : edge > 0 ? "positive" : edge < 0 ? "negative" : "neutral"}`}
    >
      {edgeText(edge)}
    </span>
  );
}
export default function PropCard({
  prop: p,
  game,
  saved,
  onSave,
  onOpen,
  index = 0,
}: {
  prop: Prop;
  game: Game;
  saved: boolean;
  onSave: () => void;
  onOpen: () => void;
  index?: number;
}) {
  const delta =
    p.history.length > 1
      ? p.history[p.history.length - 1].line - p.history[0].line
      : null;
  return (
    <motion.article
      className="prop-card"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: index * 0.04 }}
    >
      <div className="card-top">
        <ConfidenceBadge confidence={p.confidence} />
        <button
          className={`icon-button save-button ${saved ? "is-saved" : ""}`}
          onClick={onSave}
          aria-label={`${saved ? "Unsave" : "Save"} ${p.player} ${p.market}`}
          aria-pressed={saved}
        >
          <Bookmark size={18} fill={saved ? "currentColor" : "none"} />
        </button>
      </div>
      <button
        className="card-main"
        onClick={onOpen}
        aria-label={`Analyze ${p.player} ${p.side} ${p.line} ${p.market}`}
      >
        <div className="player-heading">
          <span className={`avatar team-${p.team.toLowerCase()}`}>
            {initials(p.player)}
          </span>
          <div>
            <h3>{p.player}</h3>
            <p>
              {p.team} <span>·</span> {game.awayAbbr} @ {game.homeAbbr}
            </p>
          </div>
        </div>
        <div className="pick-line">
          <div>
            <span className="eyebrow">{p.market}</span>
            <h4>
              {p.side === "over" ? (
                <ArrowUpRight size={21} />
              ) : (
                <ArrowDownLeft size={21} />
              )}{" "}
              {p.side === "over" ? "Over" : "Under"} {value(p.line)}{" "}
              <small>{signed(p.odds)}</small>
            </h4>
          </div>
          <div className="card-edge">
            <EdgeBadge edge={p.edge} />
            <span>MODEL EDGE</span>
          </div>
        </div>
        <div className="card-stats">
          <div>
            <span>Projection</span>
            <strong>{value(p.projection)}</strong>
          </div>
          <div>
            <span>Probability</span>
            <strong>{percent(p.probability)}</strong>
          </div>
          <div>
            <span>Line movement</span>
            <strong className="movement">
              {delta === null ? (
                "—"
              ) : (
                <>
                  {delta < 0 ? (
                    <TrendingDown size={13} />
                  ) : (
                    <TrendingUp size={13} />
                  )}{" "}
                  {signed(delta)}
                </>
              )}
            </strong>
          </div>
        </div>
      </button>
      <div className="card-footer">
        <span title={stamp(p.updatedAt)}>
          <Clock3 size={12} />
          {p.updatedAt
            ? "Snapshot " +
              new Date(p.updatedAt).toISOString().slice(11, 16) +
              " UTC"
            : "Update unavailable"}
        </span>
        <button onClick={onOpen}>
          View analysis <ChevronRight size={14} />
        </button>
      </div>
    </motion.article>
  );
}
