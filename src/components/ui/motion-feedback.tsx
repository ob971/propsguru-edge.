"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Bookmark, Check } from "lucide-react";
import { signed } from "@/lib/data";

export const quickTransition = {
  duration: 0.2,
  ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
};

export function SaveButton({
  saved,
  label,
  onClick,
}: {
  saved: boolean;
  label: string;
  onClick: () => void;
}) {
  const reduced = useReducedMotion();
  return (
    <button
      className={`icon-button save-button ${saved ? "is-saved" : ""}`}
      onClick={onClick}
      aria-label={`${saved ? "Unsave" : "Save"} ${label}`}
      aria-pressed={saved}
      title={saved ? "Remove from saved props" : "Save prop"}
    >
      <motion.span
        className="save-glyph"
        initial={false}
        animate={{ scale: saved && !reduced ? [1, 0.8, 1.12, 1] : 1 }}
        transition={{ duration: reduced ? 0 : 0.25 }}
      >
        {saved ? <Check size={18} /> : <Bookmark size={18} />}
      </motion.span>
    </button>
  );
}

export function OddsValue({
  odds,
  previous,
}: {
  odds: number | null;
  previous?: number;
}) {
  const changed = odds !== null && previous !== undefined && previous !== odds;
  const description = changed
    ? `Odds ${signed(odds)}, previously ${signed(previous)} in the preceding snapshot`
    : undefined;
  return (
    <span
      key={odds}
      className={changed ? "odds-value odds-changed" : "odds-value"}
      title={description}
      aria-label={description}
    >
      {signed(odds)}
      {changed && (
        <span className="odds-direction" aria-hidden="true">
          {odds > previous ? "↑" : "↓"}
        </span>
      )}
    </span>
  );
}
