"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  ArrowDownUp,
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  CalendarDays,
  ChartNoAxesCombined,
  Check,
  ChevronDown,
  CircleHelp,
  Command,
  Compass,
  Download,
  Filter,
  Layers3,
  Search,
  SlidersHorizontal,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { MotionConfig } from "framer-motion";
import demo from "@/data/demo.json";
import {
  type Dataset,
  type Game,
  type Prop,
  type Sort,
  parseDataset,
  rankProps,
  isOpportunity,
  isStrong,
  value,
  signed,
  percent,
  edgeText,
  shortDate,
  time,
  stamp,
  initials,
} from "@/lib/data";
import PropCard, { ConfidenceBadge, EdgeBadge } from "./prop-card";
import PropDetail from "./prop-detail";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "./ui/dialog";
const initialData = parseDataset(demo);
type View = "opportunities" | "games" | "props" | "saved";
const nav = [
  { id: "opportunities", label: "Opportunities", icon: Compass },
  { id: "games", label: "Games", icon: CalendarDays },
  { id: "props", label: "All props", icon: Layers3 },
  { id: "saved", label: "Saved props", icon: Bookmark },
] as const;
export default function Workspace() {
  const [data, setData] = useState<Dataset>(initialData);
  const [view, setView] = useState<View>("opportunities");
  const [sport, setSport] = useState("All sports");
  const [query, setQuery] = useState("");
  const [gameId, setGameId] = useState("all");
  const [market, setMarket] = useState("all");
  const [side, setSide] = useState("all");
  const [confidence, setConfidence] = useState("all");
  const [minEdge, setMinEdge] = useState("all");
  const [sort, setSort] = useState<Sort>("edge");
  const [saved, setSaved] = useState<string[]>([]);
  const [selected, setSelected] = useState<Prop | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importError, setImportError] = useState("");
  const [notice, setNotice] = useState("");
  const [savedReady, setSavedReady] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    try {
      const stored = JSON.parse(
        localStorage.getItem("propsguru-saved-v1") || "[]",
      );
      if (Array.isArray(stored))
        setSaved(stored.filter((v) => typeof v === "string"));
    } catch {}
    setSavedReady(true);
  }, []);
  useEffect(() => {
    if (savedReady)
      try {
        localStorage.setItem("propsguru-saved-v1", JSON.stringify(saved));
      } catch {
        setNotice(
          "Browser storage is unavailable. Saves will last for this session.",
        );
      }
  }, [saved, savedReady]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 4500);
    return () => clearTimeout(t);
  }, [notice]);
  const saveKey = (p: Prop) =>
    `${p.gameId}:${p.player}:${p.market}:${p.side}:${p.line}`;
  const isSaved = (p: Prop) => saved.includes(saveKey(p));
  function toggleSave(p: Prop) {
    const key = saveKey(p);
    setSaved((old) =>
      old.includes(key) ? old.filter((v) => v !== key) : [...old, key],
    );
  }
  const sports = ["All sports", ...new Set(data.games.map((g) => g.sport))];
  const markets = [...new Set(data.props.map((p) => p.market))].sort();
  const gameMap = useMemo(
    () => new Map(data.games.map((g) => [g.id, g])),
    [data],
  );
  const activeFilters = [gameId, market, side, confidence, minEdge].filter(
    (v) => v !== "all",
  ).length;
  function reset() {
    setQuery("");
    setGameId("all");
    setMarket("all");
    setSide("all");
    setConfidence("all");
    setMinEdge("all");
    setSport("All sports");
  }
  function navigate(v: View) {
    setView(v);
    reset();
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  function openProp(p: Prop) {
    openerRef.current = document.activeElement as HTMLElement;
    setSelected(p);
  }
  function closeProp() {
    setSelected(null);
    requestAnimationFrame(() => openerRef.current?.focus());
  }
  const filtered = useMemo(
    () =>
      rankProps(
        data.props.filter((p) => {
          const g = gameMap.get(p.gameId)!;
          const matchesQuery = [
            p.player,
            p.team,
            p.market,
            g.homeTeam,
            g.awayTeam,
            g.homeAbbr,
            g.awayAbbr,
          ]
            .join(" ")
            .toLowerCase()
            .includes(query.toLowerCase().trim());
          return (
            matchesQuery &&
            (sport === "All sports" || g.sport === sport) &&
            (gameId === "all" || p.gameId === gameId) &&
            (market === "all" || p.market === market) &&
            (side === "all" || p.side === side) &&
            (confidence === "all" || p.confidence === confidence) &&
            (minEdge === "all" ||
              (p.edge !== null && p.edge >= Number(minEdge))) &&
            (view !== "opportunities" || isOpportunity(p)) &&
            (view !== "saved" || saved.includes(saveKey(p)))
          );
        }),
        sort,
      ),
    [
      data,
      gameMap,
      query,
      sport,
      gameId,
      market,
      side,
      confidence,
      minEdge,
      view,
      saved,
      sort,
    ],
  );
  const eligibleGames = data.games.filter(
    (g) =>
      (sport === "All sports" || g.sport === sport) &&
      (gameId === "all" || g.id === gameId),
  );
  const visibleGames =
    view === "games"
      ? eligibleGames.filter(
          (g) =>
            filtered.some((p) => p.gameId === g.id) ||
            (!query &&
              !activeFilters &&
              !data.props.some((p) => p.gameId === g.id)),
        )
      : eligibleGames;
  const latest = data.props.reduce<string | null>(
    (last, p) =>
      p.updatedAt && (!last || Date.parse(p.updatedAt) > Date.parse(last))
        ? p.updatedAt
        : last,
    null,
  );
  const strong = data.props.filter(isStrong).length;
  const savedCount = data.props.filter(isSaved).length;
  const filterFields = (
    <div className="filter-fields">
      <label>
        Game
        <select value={gameId} onChange={(e) => setGameId(e.target.value)}>
          <option value="all">All games</option>
          {data.games.map((g) => (
            <option key={g.id} value={g.id}>
              {g.awayAbbr} @ {g.homeAbbr}
            </option>
          ))}
        </select>
      </label>
      <label>
        Prop type
        <select value={market} onChange={(e) => setMarket(e.target.value)}>
          <option value="all">All prop types</option>
          {markets.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
      </label>
      <label>
        Direction
        <select value={side} onChange={(e) => setSide(e.target.value)}>
          <option value="all">Over & under</option>
          <option value="over">Over</option>
          <option value="under">Under</option>
        </select>
      </label>
      <label>
        Confidence
        <select
          value={confidence}
          onChange={(e) => setConfidence(e.target.value)}
        >
          <option value="all">Any confidence</option>
          {["high", "medium", "low", "unknown"].map((c) => (
            <option key={c} value={c}>
              {c === "unknown" ? "Unrated" : c[0].toUpperCase() + c.slice(1)}
            </option>
          ))}
        </select>
      </label>
      <label>
        Minimum edge
        <select value={minEdge} onChange={(e) => setMinEdge(e.target.value)}>
          <option value="all">Any edge</option>
          <option value="0">0% and above</option>
          <option value="5">5% and above</option>
          <option value="10">10% and above</option>
        </select>
      </label>
    </div>
  );
  async function importFile(file: File | undefined) {
    if (!file) return;
    setImportError("");
    try {
      if (file.size > 5 * 1024 * 1024)
        throw new Error("Please use a JSON file smaller than 5 MB.");
      const parsed = parseDataset(JSON.parse(await file.text()));
      setData(parsed);
      reset();
      setSelected(null);
      setImportOpen(false);
      setNotice(
        `Loaded ${parsed.props.length} props across ${parsed.games.length} games.`,
      );
    } catch (e) {
      setImportError(
        e instanceof Error ? e.message : "Unable to read this JSON file.",
      );
    }
  }
  return (
    <MotionConfig reducedMotion="user">
      <div className="app-shell">
        <a className="skip-link" href="#main">
          Skip to opportunities
        </a>
        <aside className="sidebar">
          <a
            href="#"
            className="brand"
            onClick={(e) => {
              e.preventDefault();
              navigate("opportunities");
            }}
            aria-label="Propsguru Edge home"
          >
            <span className="brand-mark">
              <ChartNoAxesCombined size={24} />
            </span>
            <span>
              propsguru
              <span className="brand-sub">
                EDGE <i />
              </span>
            </span>
          </a>
          <div className="nav-caption">YOUR ADVANTAGE</div>
          <nav aria-label="Main navigation">
            {nav.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => navigate(id)}
                className={view === id ? "nav-item active" : "nav-item"}
                aria-current={view === id ? "page" : undefined}
              >
                <Icon size={18} />
                <span>{label}</span>
                {id === "saved" && savedCount > 0 ? (
                  <b>{savedCount}</b>
                ) : id === "opportunities" ? (
                  <span className="nav-dot" />
                ) : null}
              </button>
            ))}
          </nav>
          <div className="sidebar-note">
            <div className="radar-icon">
              <Activity size={21} />
            </div>
            <h3>
              A little more insight.
              <br />A better perspective.
            </h3>
            <p>Understand the numbers behind the opportunity.</p>
            <button onClick={() => setHelpOpen(true)}>
              How Edge works <ArrowUpRight size={14} />
            </button>
          </div>
          <div className="sidebar-bottom">
            <button className="nav-item" onClick={() => setImportOpen(true)}>
              <Upload size={17} />
              <span>Data source</span>
            </button>
            <button className="nav-item" onClick={() => setHelpOpen(true)}>
              <CircleHelp size={17} />
              <span>The methodology</span>
            </button>
            <div className="profile">
              <span>PG</span>
              <div>
                Personal workspace<small>Built for the informed fan</small>
              </div>
            </div>
          </div>
        </aside>
        <div className="main-shell">
          <header className="topbar">
            <div className="breadcrumb">
              Workspace <span>/</span>
              <b>{nav.find((n) => n.id === view)?.label}</b>
            </div>
            <a
              className="mobile-brand"
              href="#"
              onClick={(e) => {
                e.preventDefault();
                navigate("opportunities");
              }}
            >
              <ChartNoAxesCombined size={23} /> propsguru <b>EDGE</b>
            </a>
            <label className="global-search">
              <Search size={16} />
              <input
                ref={searchRef}
                aria-label="Search players, teams, or markets"
                placeholder="Search players, teams..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query ? (
                <button onClick={() => setQuery("")} aria-label="Clear search">
                  <X size={14} />
                </button>
              ) : (
                <kbd>
                  <Command size={11} /> K
                </kbd>
              )}
            </label>
            <button
              className="source-status"
              onClick={() => setImportOpen(true)}
            >
              <span />
              {data.demo ? "Demo dataset" : "Imported dataset"}
              <ChevronDown size={13} />
            </button>
          </header>
          <main id="main">
            <div className="page-heading">
              <div>
                <div className="eyebrow heading-eyebrow">
                  <span /> THE INFORMED FAN’S ADVANTAGE
                </div>
                <h1>
                  {view === "opportunities" ? (
                    <>
                      Find your <em>edge.</em>
                    </>
                  ) : view === "games" ? (
                    <>
                      Every game. <em>More insight.</em>
                    </>
                  ) : view === "saved" ? (
                    <>
                      Your saved <em>signals.</em>
                    </>
                  ) : (
                    <>
                      See the <em>whole picture.</em>
                    </>
                  )}
                </h1>
                <p>
                  {view === "opportunities"
                    ? "The market sets the line. Find where the model sees more."
                    : view === "games"
                      ? "Explore the matchups and the opportunities within them."
                      : view === "saved"
                        ? "A closer watch on the props that caught your eye."
                        : "Every model signal, including the ones worth passing on."}
                </p>
              </div>
              <button
                className="slate-date"
                onClick={() => setImportOpen(true)}
              >
                <CalendarDays size={16} />
                <span>
                  {latest
                    ? shortDate(latest) +
                      ", " +
                      new Date(latest).getUTCFullYear()
                    : "Dataset"}
                  <small>
                    {data.demo ? "Sample slate · not live" : data.label}
                  </small>
                </span>
                <ChevronDown size={14} />
              </button>
            </div>
            <section className="overview-strip" aria-label="Dataset overview">
              <div>
                <span className="stat-icon">
                  <CalendarDays size={19} />
                </span>
                <div>
                  <strong>
                    {data.games.length}
                    <span>games on the slate</span>
                  </strong>
                  <small>
                    Across {new Set(data.games.map((g) => g.sport)).size} sports
                  </small>
                </div>
              </div>
              <div>
                <span className="stat-icon">
                  <Layers3 size={19} />
                </span>
                <div>
                  <strong>
                    {data.props.length}
                    <span>player props</span>
                  </strong>
                  <small>Every angle, in one place</small>
                </div>
              </div>
              <div>
                <span className="stat-icon lime">
                  <Sparkles size={19} />
                </span>
                <div>
                  <strong>
                    {strong}
                    <span>strong signals</span>
                  </strong>
                  <small>High confidence · 5%+ edge</small>
                </div>
              </div>
              <div className="snapshot-stat">
                <span className="pulse-dot" />
                <div>
                  <span>Latest model snapshot</span>
                  <small>{stamp(latest)}</small>
                </div>
              </div>
            </section>
            {data.warnings.length > 0 && (
              <details className="data-warning">
                <summary>
                  {data.warnings.length} data quality notes — valid records are
                  still available
                </summary>
                {data.warnings.map((w, i) => (
                  <p key={i}>{w}</p>
                ))}
              </details>
            )}
            <div className="sport-toolbar">
              <div
                className="sport-tabs"
                role="group"
                aria-label="Filter sport"
              >
                {sports.map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setSport(s);
                      setGameId("all");
                    }}
                    className={sport === s ? "selected" : ""}
                    aria-pressed={sport === s}
                  >
                    {s === "All sports" ? (
                      <Layers3 size={15} />
                    ) : (
                      <span className="sport-ball">
                        {s === "NBA"
                          ? "◉"
                          : s === "NFL"
                            ? "◈"
                            : s === "MLB"
                              ? "◌"
                              : "◇"}
                      </span>
                    )}
                    {s}
                  </button>
                ))}
              </div>
              <span className="snapshot-label">
                <span />{" "}
                {data.demo ? "ILLUSTRATIVE DATA" : "LOCAL DATA SNAPSHOT"}
              </span>
            </div>
            {view === "games" ? (
              <section className="games-section">
                <div className="section-title">
                  <h2>
                    The game plan <span>{visibleGames.length}</span>
                  </h2>
                  <span>All start times in UTC</span>
                </div>
                <div className="games-grid">
                  {visibleGames.map((g) => (
                    <GameCard
                      key={g.id}
                      game={g}
                      props={filtered.filter((p) => p.gameId === g.id)}
                      onClick={() => {
                        setGameId(g.id);
                        setView("props");
                      }}
                    />
                  ))}
                </div>
                {visibleGames.length === 0 && <Empty onReset={reset} />}
              </section>
            ) : (
              <>
                {view === "opportunities" && (
                  <section className="game-rail" aria-label="Browse games">
                    <button
                      className={`all-games-tile ${gameId === "all" ? "current" : ""}`}
                      onClick={() => setGameId("all")}
                    >
                      <CalendarDays size={19} />
                      <strong>The full slate</strong>
                      <small>
                        {
                          data.games.filter(
                            (g) => sport === "All sports" || g.sport === sport,
                          ).length
                        }{" "}
                        games <ArrowRight size={13} />
                      </small>
                    </button>
                    {data.games
                      .filter(
                        (g) => sport === "All sports" || g.sport === sport,
                      )
                      .map((g) => (
                        <button
                          key={g.id}
                          className={`game-tile ${gameId === g.id ? "current" : ""}`}
                          onClick={() =>
                            setGameId(gameId === g.id ? "all" : g.id)
                          }
                          aria-pressed={gameId === g.id}
                        >
                          <div>
                            <span>{g.sport}</span>
                            <small>{time(g.startsAt)} UTC</small>
                          </div>
                          <strong>
                            <span
                              className={`team-dot team-${g.awayAbbr.toLowerCase()}`}
                            >
                              {g.awayAbbr[0]}
                            </span>
                            {g.awayAbbr}
                            <span className="at">@</span>
                            <span
                              className={`team-dot team-${g.homeAbbr.toLowerCase()}`}
                            >
                              {g.homeAbbr[0]}
                            </span>
                            {g.homeAbbr}
                          </strong>
                          <small>
                            {data.props.filter((p) => p.gameId === g.id).length}{" "}
                            props <span>·</span> {shortDate(g.startsAt)}
                          </small>
                        </button>
                      ))}
                  </section>
                )}
                <section className="opportunities-section">
                  <div className="section-title">
                    <div>
                      <div className="title-with-icon">
                        {view === "opportunities" && (
                          <Sparkles size={20} className="lime-text" />
                        )}
                        <h2>
                          {view === "opportunities"
                            ? "Top opportunities"
                            : view === "saved"
                              ? "Your watchlist"
                              : "Explore player props"}
                        </h2>
                        <span className="count-badge">{filtered.length}</span>
                      </div>
                      <p>
                        {view === "opportunities"
                          ? "A stronger signal starts with a closer look."
                          : view === "saved"
                            ? "Saved on this device. Ready when you are."
                            : "Look beyond the recommendation. Understand the numbers."}
                      </p>
                    </div>
                    <button
                      className="text-button methodology-link"
                      onClick={() => setHelpOpen(true)}
                    >
                      How we rank <CircleHelp size={14} />
                    </button>
                  </div>
                  <div className="filter-toolbar">
                    <div className="quick-filters">
                      <label className="select-wrap">
                        <select
                          aria-label="Filter by prop type"
                          value={market}
                          onChange={(e) => setMarket(e.target.value)}
                        >
                          <option value="all">All prop types</option>
                          {markets.map((m) => (
                            <option key={m}>{m}</option>
                          ))}
                        </select>
                        <ChevronDown size={13} />
                      </label>
                      <label className="select-wrap desktop-confidence">
                        <select
                          aria-label="Filter by confidence"
                          value={confidence}
                          onChange={(e) => setConfidence(e.target.value)}
                        >
                          <option value="all">Any confidence</option>
                          <option value="high">High confidence</option>
                          <option value="medium">Medium confidence</option>
                          <option value="low">Low confidence</option>
                          <option value="unknown">Unrated</option>
                        </select>
                        <ChevronDown size={13} />
                      </label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setFilterOpen(true)}
                      >
                        <SlidersHorizontal size={14} />
                        <span>Filters</span>
                        {activeFilters > 0 && (
                          <b className="filter-count">{activeFilters}</b>
                        )}
                      </Button>
                      {(activeFilters > 0 ||
                        query ||
                        sport !== "All sports") && (
                        <button className="reset-button" onClick={reset}>
                          Reset <X size={12} />
                        </button>
                      )}
                    </div>
                    <label className="sort-control">
                      <ArrowDownUp size={13} />
                      <select
                        value={sort}
                        onChange={(e) => setSort(e.target.value as Sort)}
                        aria-label="Sort props"
                      >
                        <option value="edge">Best edge</option>
                        <option value="probability">Highest probability</option>
                        <option value="confidence">Highest confidence</option>
                        <option value="difference">
                          Projection difference
                        </option>
                        <option value="updated">Recently updated</option>
                      </select>
                      <ChevronDown size={12} />
                    </label>
                  </div>
                  {gameId !== "all" && (
                    <div className="active-game">
                      Showing {gameMap.get(gameId)?.awayTeam} @{" "}
                      {gameMap.get(gameId)?.homeTeam}
                      <button
                        aria-label="Clear game filter"
                        onClick={() => setGameId("all")}
                      >
                        <X size={13} />
                      </button>
                    </div>
                  )}
                  <p className="sr-only" role="status">
                    {filtered.length} matching props
                  </p>
                  {filtered.length === 0 ? (
                    <Empty
                      saved={view === "saved"}
                      onReset={
                        view === "saved"
                          ? () => navigate("opportunities")
                          : reset
                      }
                    />
                  ) : (
                    <div className="prop-grid">
                      {filtered
                        .slice(
                          0,
                          view === "opportunities" ? 3 : filtered.length,
                        )
                        .map((p, i) => (
                          <PropCard
                            key={p.id}
                            prop={p}
                            game={gameMap.get(p.gameId)!}
                            saved={isSaved(p)}
                            onSave={() => toggleSave(p)}
                            onOpen={() => openProp(p)}
                            index={Math.min(i, 5)}
                          />
                        ))}
                    </div>
                  )}
                </section>
                {view === "opportunities" && filtered.length > 3 && (
                  <section className="market-section">
                    <div className="section-title">
                      <div>
                        <h2>More on the radar</h2>
                        <p>Explore the rest of the positive-edge board.</p>
                      </div>
                      <button
                        className="text-button"
                        onClick={() => setView("props")}
                      >
                        Explore all props <ArrowRight size={15} />
                      </button>
                    </div>
                    <div className="prop-table-wrap">
                      <table className="prop-table">
                        <thead>
                          <tr>
                            <th>PLAYER / MATCHUP</th>
                            <th>PROP</th>
                            <th>PROJECTION</th>
                            <th>PROBABILITY</th>
                            <th>MODEL EDGE</th>
                            <th>CONFIDENCE</th>
                            <th>
                              <span className="sr-only">Actions</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {filtered.slice(3).map((p) => (
                            <tr key={p.id}>
                              <td>
                                <button
                                  className="table-player"
                                  onClick={() => openProp(p)}
                                >
                                  <span
                                    className={`avatar small team-${p.team.toLowerCase()}`}
                                  >
                                    {initials(p.player)}
                                  </span>
                                  <span>
                                    <b>{p.player}</b>
                                    <small>
                                      {p.team} ·{" "}
                                      {gameMap.get(p.gameId)?.awayAbbr} @{" "}
                                      {gameMap.get(p.gameId)?.homeAbbr}
                                    </small>
                                  </span>
                                </button>
                              </td>
                              <td>
                                <button
                                  className="table-prop"
                                  onClick={() => openProp(p)}
                                >
                                  <b>
                                    {p.side === "over" ? "Over" : "Under"}{" "}
                                    {value(p.line)}{" "}
                                    <small>{signed(p.odds)}</small>
                                  </b>
                                  <span>{p.market}</span>
                                </button>
                              </td>
                              <td>{value(p.projection)}</td>
                              <td>{percent(p.probability)}</td>
                              <td>
                                <EdgeBadge edge={p.edge} />
                              </td>
                              <td>
                                <ConfidenceBadge confidence={p.confidence} />
                              </td>
                              <td>
                                <button
                                  className={`icon-button ${isSaved(p) ? "is-saved" : ""}`}
                                  onClick={() => toggleSave(p)}
                                  aria-label={`${isSaved(p) ? "Unsave" : "Save"} ${p.player} ${p.market}`}
                                  aria-pressed={isSaved(p)}
                                >
                                  <Bookmark
                                    size={16}
                                    fill={isSaved(p) ? "currentColor" : "none"}
                                  />
                                </button>
                                <button
                                  className="icon-button"
                                  aria-label={`Analyze ${p.player} ${p.market}`}
                                  onClick={() => openProp(p)}
                                >
                                  <ArrowUpRight size={17} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                )}
              </>
            )}
            <div className="bottom-note">
              <span className="brand-mini">
                <ChartNoAxesCombined size={17} /> Built on insight. Grounded in
                data.
              </span>
              <span>
                {data.demo
                  ? "Demo data · fictional slate and model outputs"
                  : "Imported data · browser session only"}{" "}
                <span className="separator">/</span> No outcome is guaranteed.
              </span>
            </div>
          </main>
        </div>
        <nav className="mobile-nav" aria-label="Mobile navigation">
          {nav.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={view === id ? "active" : ""}
              onClick={() => navigate(id)}
              aria-current={view === id ? "page" : undefined}
            >
              <Icon size={20} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <PropDetail
          prop={selected}
          game={selected ? gameMap.get(selected.gameId) : undefined}
          open={!!selected}
          onClose={closeProp}
          saved={selected ? isSaved(selected) : false}
          onSave={() => selected && toggleSave(selected)}
        />
        <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
          <DialogContent className="filter-dialog">
            <DialogTitle>Find your angle</DialogTitle>
            <DialogDescription>
              Narrow the slate to what matters to you.
            </DialogDescription>
            {filterFields}
            <div className="modal-actions">
              <Button variant="ghost" onClick={reset}>
                Reset all
              </Button>
              <Button onClick={() => setFilterOpen(false)}>
                Show {filtered.length} props <ArrowRight size={16} />
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
          <DialogContent className="info-dialog">
            <div className="detail-kicker">
              <ChartNoAxesCombined size={16} /> THE METHODOLOGY
            </div>
            <DialogTitle>Clarity before conviction.</DialogTitle>
            <DialogDescription>
              What the numbers mean, and how to read them.
            </DialogDescription>
            <div className="help-sections">
              <section>
                <h3>01 · Edge comes first</h3>
                <p>
                  Opportunities have a positive supplied edge. By default, we
                  rank by edge, then confidence, then model probability. A
                  strong signal means at least 5 percentage points of edge and
                  high confidence.
                </p>
              </section>
              <section>
                <h3>02 · A projection is one piece of the picture</h3>
                <p>
                  The projection is the model’s estimate for a player’s stat.
                  Probability estimates how likely the selected side is to hit.
                  These are distinct outputs and may disagree; analysis
                  highlights conflicting signals.
                </p>
              </section>
              <section>
                <h3>03 · Read the market</h3>
                <p>
                  Odds use the American format. Implied probability is
                  calculated directly from the listed odds, without removing
                  sportsbook margin. Supplied edge is shown as percentage
                  points; it is not recalculated or treated as expected return.
                </p>
              </section>
              <section>
                <h3>04 · Know your snapshot</h3>
                <p>
                  This is a local, static dataset. Timestamps are absolute and
                  shown in UTC. There is no live feed.{" "}
                  {data.demo
                    ? "The current games, lines, and model outputs are fictional examples because the original JSON was not attached."
                    : ""}
                </p>
              </section>
            </div>
            <Button onClick={() => setHelpOpen(false)}>
              Got it <Check size={16} />
            </Button>
          </DialogContent>
        </Dialog>
        <Dialog open={importOpen} onOpenChange={setImportOpen}>
          <DialogContent className="info-dialog">
            <div className="detail-kicker">
              <Layers3 size={16} /> YOUR DATA SOURCE
            </div>
            <DialogTitle>Bring your own slate.</DialogTitle>
            <DialogDescription>
              {data.demo
                ? "You’re exploring a labeled demo fixture. The original JSON wasn’t included with the brief."
                : `Currently exploring ${data.label}.`}
            </DialogDescription>
            <div className="import-box">
              <Upload size={27} />
              <h3>Load a JSON dataset</h3>
              <p>
                Your file stays in this browser tab. Reloading restores the
                demo.
              </p>
              <label className="ui-button button-primary file-label">
                Choose JSON file
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={(e) => importFile(e.target.files?.[0])}
                />
              </label>
            </div>
            {importError && (
              <p className="import-error" role="alert">
                {importError}
              </p>
            )}
            <p className="schema-note">
              Expected: <code>games[]</code> and <code>props[]</code>.
              Probability uses 0–1, edge uses percentage points, and odds use
              American format. Missing optional values are shown as unavailable.
            </p>
            <div className="modal-actions">
              <Button asChild variant="outline">
                <a href="/example-data.json" download>
                  <Download size={15} /> Example JSON
                </a>
              </Button>
              {!data.demo && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setData(initialData);
                    reset();
                    setImportOpen(false);
                  }}
                >
                  Restore demo
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
        {notice && (
          <div className="toast" role="status">
            <Check size={16} />
            {notice}
          </div>
        )}
      </div>
    </MotionConfig>
  );
}
function GameCard({
  game: g,
  props,
  onClick,
}: {
  game: Game;
  props: Prop[];
  onClick: () => void;
}) {
  const top = rankProps(props)[0];
  return (
    <button className="full-game-card" onClick={onClick}>
      <div className="game-card-meta">
        <span>
          {g.sport} <b>·</b> {g.status}
        </span>
        <span>
          {shortDate(g.startsAt)} · {time(g.startsAt)} UTC
        </span>
      </div>
      <div className="matchup">
        <div>
          <span className={`team-emblem team-${g.awayAbbr.toLowerCase()}`}>
            {g.awayAbbr}
          </span>
          <strong>{g.awayTeam}</strong>
        </div>
        <span>@</span>
        <div>
          <span className={`team-emblem team-${g.homeAbbr.toLowerCase()}`}>
            {g.homeAbbr}
          </span>
          <strong>{g.homeTeam}</strong>
        </div>
      </div>
      <div className="game-card-footer">
        <span>
          {props.length} props <b>·</b> {props.filter(isStrong).length} strong
          signals
        </span>
        <span>
          {top && top.edge !== null ? (
            <>{edgeText(top.edge)} best edge</>
          ) : (
            "Explore matchup"
          )}{" "}
          <ArrowRight size={15} />
        </span>
      </div>
    </button>
  );
}
function Empty({
  onReset,
  saved = false,
}: {
  onReset: () => void;
  saved?: boolean;
}) {
  return (
    <div className="empty-state">
      {saved ? <Bookmark size={28} /> : <Filter size={28} />}
      <h3>
        {saved
          ? "Your next insight belongs here."
          : "No props match this view."}
      </h3>
      <p>
        {saved
          ? "Save a prop to keep its analysis close at hand."
          : "Try another search or loosen your filters."}
      </p>
      <Button variant="outline" onClick={onReset}>
        {saved ? "Explore opportunities" : "Reset filters"}
        <ArrowRight size={15} />
      </Button>
    </div>
  );
}
