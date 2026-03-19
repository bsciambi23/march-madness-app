import React, { useEffect, useMemo, useState } from "react";

const REGION_ORDER = ["East", "West", "South", "Midwest"];

function formatET(dateString) {
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: "America/New_York",
    }).format(new Date(dateString));
  } catch {
    return "";
  }
}

function ml(value) {
  if (value === null || value === undefined || value === "") return "-";
  return value > 0 ? `+${value}` : `${value}`;
}

function hasStarted(game) {
  if (!game?.commence_time) return false;
  return new Date() >= new Date(game.commence_time);
}

function getOutcomeMap(market) {
  const map = {};
  for (const outcome of market?.outcomes || []) {
    map[outcome.name] = outcome;
  }
  return map;
}

function buildGame(raw, index) {
  const bookmaker = raw.bookmakers?.[0];
  const markets = bookmaker?.markets || [];

  const h2h = markets.find((m) => m.key === "h2h");
  const spreads = markets.find((m) => m.key === "spreads");
  const totals = markets.find((m) => m.key === "totals");

  const h2hMap = getOutcomeMap(h2h);
  const spreadMap = getOutcomeMap(spreads);

  const totalPoint = totals?.outcomes?.[0]?.point ?? "-";
  const started = new Date() >= new Date(raw.commence_time);

  return {
    id: raw.id || `game-${index + 1}`,
    region: REGION_ORDER[Math.floor(index / 8)] || REGION_ORDER[index % 4],
    slot: (index % 8) + 1,
    round: "First Round",
    seedAway: "-",
    seedHome: "-",
    away_team: raw.away_team,
    home_team: raw.home_team,
    commence_time: raw.commence_time,
    status: started ? "live" : "pregame",
    locked: started,
    score: null,
    odds: {
      moneyline: {
        [raw.away_team]: h2hMap[raw.away_team]?.price,
        [raw.home_team]: h2hMap[raw.home_team]?.price,
      },
      spread: {
        [raw.away_team]: spreadMap[raw.away_team]?.point,
        [raw.home_team]: spreadMap[raw.home_team]?.point,
      },
      total: totalPoint,
    },
  };
}

function placeholderGame(region, slot) {
  return {
    id: `placeholder-${region}-${slot}`,
    region,
    slot,
    round: "First Round",
    seedAway: "-",
    seedHome: "-",
    away_team: "TBD",
    home_team: "TBD",
    commence_time: "",
    status: "pregame",
    locked: false,
    score: null,
    odds: {
      moneyline: {},
      spread: {},
      total: "-",
    },
    isPlaceholder: true,
  };
}

function matchupLabel(game) {
  if (game.isPlaceholder) return "TBD vs TBD";
  return `${game.away_team} vs ${game.home_team}`;
}

function teamRow(game, side) {
  const name = side === "away" ? game.away_team : game.home_team;
  const seed = side === "away" ? game.seedAway : game.seedHome;
  const score = game.score?.[name] ?? "-";
  const moneyline = game.odds?.moneyline?.[name];
  const spread = game.odds?.spread?.[name];
  const total = game.odds?.total ?? "-";

  return (
    <div style={styles.teamRow}>
      <div style={styles.teamName}>
        <span style={styles.seed}>{seed}</span>
        <span style={styles.teamNameText}>{name}</span>
      </div>

      <div style={styles.rightLine}>
        <span>{ml(moneyline)}</span>
        <span style={styles.dot}>•</span>
        <span>{ml(spread)}</span>
        <span style={styles.dot}>•</span>
        <span>{total}</span>
        <span style={styles.dot}>•</span>
        <span style={styles.score}>{score}</span>
      </div>
    </div>
  );
}

function MatchupBox({ game, onClick }) {
  if (game.isPlaceholder) {
    return (
      <div style={styles.placeholderBox}>
        <div style={styles.placeholderTitle}>Matchup slot</div>
        <div>{matchupLabel(game)}</div>
      </div>
    );
  }

  return (
    <button onClick={() => onClick(game)} style={styles.matchupBox}>
      <div style={styles.boxTop}>{formatET(game.commence_time)}</div>
      <div style={styles.boxBody}>
        {teamRow(game, "away")}
        <div style={styles.rowDivider} />
        {teamRow(game, "home")}
      </div>
      <div style={styles.boxBottom}>
        <span>{game.status}</span>
        <span>{hasStarted(game) ? "locked" : "updating"}</span>
      </div>
    </button>
  );
}

function FutureBox({ text, tall = false }) {
  return (
    <div
      style={{
        ...styles.futureBox,
        minHeight: tall ? 72 : 52,
      }}
    >
      {text}
    </div>
  );
}

function GameModal({ game, onClose }) {
  if (!game) return null;

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <div>
            <div style={styles.modalSmall}>
              {game.region} • {game.round}
            </div>
            <div style={styles.modalTitle}>
              {game.away_team} vs {game.home_team}
            </div>
          </div>
          <button style={styles.closeButton} onClick={onClose}>
            Close
          </button>
        </div>

        <div style={styles.modalSection}>
          <div style={styles.modalInfoRow}>
            <span>{formatET(game.commence_time)}</span>
            <span>{hasStarted(game) ? "Odds locked" : "Odds updating"}</span>
          </div>

          <div style={styles.modalTeamCard}>{teamRow(game, "away")}</div>
          <div style={styles.modalTeamCard}>{teamRow(game, "home")}</div>
        </div>

        <div style={styles.modalOddsGrid}>
          <div style={styles.statBox}>
            <div style={styles.statLabel}>Moneyline</div>
            <div>{game.away_team}: {ml(game.odds.moneyline?.[game.away_team])}</div>
            <div>{game.home_team}: {ml(game.odds.moneyline?.[game.home_team])}</div>
          </div>

          <div style={styles.statBox}>
            <div style={styles.statLabel}>Spread</div>
            <div>{game.away_team}: {ml(game.odds.spread?.[game.away_team])}</div>
            <div>{game.home_team}: {ml(game.odds.spread?.[game.home_team])}</div>
          </div>

          <div style={styles.statBox}>
            <div style={styles.statLabel}>Total</div>
            <div style={{ fontWeight: 700, fontSize: 22 }}>{game.odds.total}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadedOnce, setLoadedOnce] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [zoom, setZoom] = useState(1);
  const [selectedGame, setSelectedGame] = useState(null);

  async function loadOdds() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/odds");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || `Request failed: ${res.status}`);
      }

      const mapped = (Array.isArray(data) ? data : [])
        .slice(0, 32)
        .map((game, index) => buildGame(game, index));

      setGames(mapped);
      setLoadedOnce(true);
    } catch (err) {
      setError(err.message || "Failed to load odds.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOdds();
    const timer = setInterval(loadOdds, 60 * 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  const grouped = useMemo(() => {
    const filtered = games.filter((g) =>
      `${g.away_team} ${g.home_team} ${g.region}`.toLowerCase().includes(query.toLowerCase())
    );

    const padded = [...filtered];
    while (padded.length < 32) {
      const index = padded.length;
      const region = REGION_ORDER[Math.floor(index / 8)] || REGION_ORDER[index % 4];
      const slot = (index % 8) + 1;
      padded.push(placeholderGame(region, slot));
    }

    return REGION_ORDER.map((region, regionIndex) => ({
      region,
      games: padded.slice(regionIndex * 8, regionIndex * 8 + 8),
    }));
  }, [games, query]);

  return (
    <div style={styles.page}>
      <div style={styles.topCard}>
        <div>
          <div style={styles.appTitle}>March Madness Bracket App</div>
          <div style={styles.appSubtitle}>
            Full bracket, clickable games, auto-loading odds, and future winner lines.
          </div>
        </div>

        <div style={styles.topRight}>
          <button style={styles.primaryButton} onClick={loadOdds} disabled={loading}>
            {loading ? "Loading..." : "Load odds"}
          </button>
        </div>
      </div>

      <div style={styles.toolbar}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search team or region"
          style={styles.search}
        />

        <div style={styles.zoomButtons}>
          <button
            style={styles.secondaryButton}
            onClick={() => setZoom((z) => Math.max(0.75, +(z - 0.1).toFixed(2)))}
          >
            Zoom out
          </button>
          <button
            style={styles.secondaryButton}
            onClick={() => setZoom((z) => Math.min(1.35, +(z + 0.1).toFixed(2)))}
          >
            Zoom in
          </button>
        </div>
      </div>

      <div style={styles.notice}>
        Odds auto-load on page open, refresh every hour before tip-off, and lock when the game starts.
      </div>

      {error ? <div style={styles.error}>{error}</div> : null}

      {!loadedOnce && !loading ? (
        <div style={styles.noticeSoft}>If the bracket looks empty, click Load odds once.</div>
      ) : null}

      <div style={styles.boardOuter}>
        <div
          style={{
            ...styles.boardInner,
            transform: `scale(${zoom})`,
          }}
        >
          <div style={styles.banner}>
            <div style={styles.bannerSmall}>2026 NCAA Division I Men’s Basketball Championship</div>
            <div style={styles.bannerBig}>Interactive Bracket</div>
            <div style={styles.bannerSmall}>Click a matchup box to open it bigger</div>
          </div>

          <div style={styles.bracketGrid}>
            <div style={styles.regionColumn}>
              <div style={styles.regionTitle}>EAST</div>
              {grouped[0].games.map((game) => (
                <MatchupBox key={game.id} game={game} onClick={setSelectedGame} />
              ))}

              <div style={styles.regionTitle}>WEST</div>
              {grouped[1].games.map((game) => (
                <MatchupBox key={game.id} game={game} onClick={setSelectedGame} />
              ))}
            </div>

            <div style={styles.futureColumn}>
              <div style={styles.futureTitle}>Second Round</div>
              {Array.from({ length: 8 }).map((_, i) => (
                <FutureBox key={`l-r32-${i}`} text={`Winner of Games ${i * 2 + 1} & ${i * 2 + 2}`} />
              ))}

              <div style={styles.futureTitle}>Second Round</div>
              {Array.from({ length: 8 }).map((_, i) => (
                <FutureBox key={`l2-r32-${i}`} text={`Winner of Games ${i * 2 + 17} & ${i * 2 + 18}`} />
              ))}
            </div>

            <div style={styles.futureColumn}>
              <div style={styles.futureTitle}>Sweet 16</div>
              {Array.from({ length: 4 }).map((_, i) => (
                <FutureBox key={`l-s16-${i}`} text="Winner advances here" tall />
              ))}

              <div style={styles.futureTitle}>Sweet 16</div>
              {Array.from({ length: 4 }).map((_, i) => (
                <FutureBox key={`l2-s16-${i}`} text="Winner advances here" tall />
              ))}
            </div>

            <div style={styles.centerColumn}>
              <div style={styles.futureTitle}>Elite 8</div>
              <FutureBox text="Regional final winner" tall />
              <FutureBox text="Regional final winner" tall />

              <div style={{ height: 40 }} />

              <div style={styles.championshipBox}>
                <div style={styles.champSmall}>Final Four</div>
                <div style={styles.champBig}>Championship</div>
                <FutureBox text="Left semifinal winner" />
                <FutureBox text="Right semifinal winner" />
                <FutureBox text="National champion" />
              </div>

              <div style={{ height: 40 }} />

              <div style={styles.futureTitle}>Elite 8</div>
              <FutureBox text="Regional final winner" tall />
              <FutureBox text="Regional final winner" tall />
            </div>

            <div style={styles.futureColumn}>
              <div style={styles.futureTitle}>Sweet 16</div>
              {Array.from({ length: 4 }).map((_, i) => (
                <FutureBox key={`r-s16-${i}`} text="Winner advances here" tall />
              ))}

              <div style={styles.futureTitle}>Sweet 16</div>
              {Array.from({ length: 4 }).map((_, i) => (
                <FutureBox key={`r2-s16-${i}`} text="Winner advances here" tall />
              ))}
            </div>

            <div style={styles.futureColumn}>
              <div style={styles.futureTitle}>Second Round</div>
              {Array.from({ length: 8 }).map((_, i) => (
                <FutureBox key={`r-r32-${i}`} text={`Winner of Games ${i * 2 + 1} & ${i * 2 + 2}`} />
              ))}

              <div style={styles.futureTitle}>Second Round</div>
              {Array.from({ length: 8 }).map((_, i) => (
                <FutureBox key={`r2-r32-${i}`} text={`Winner of Games ${i * 2 + 17} & ${i * 2 + 18}`} />
              ))}
            </div>

            <div style={styles.regionColumn}>
              <div style={styles.regionTitle}>SOUTH</div>
              {grouped[2].games.map((game) => (
                <MatchupBox key={game.id} game={game} onClick={setSelectedGame} />
              ))}

              <div style={styles.regionTitle}>MIDWEST</div>
              {grouped[3].games.map((game) => (
                <MatchupBox key={game.id} game={game} onClick={setSelectedGame} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <GameModal game={selectedGame} onClose={() => setSelectedGame(null)} />
    </div>
  );
}

const styles = {
  page: {
    background: "#f3f4f6",
    minHeight: "100vh",
    padding: 16,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    color: "#0f172a",
  },
  topCard: {
    background: "#fff",
    borderRadius: 24,
    padding: 20,
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "center",
    marginBottom: 16,
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 800,
    lineHeight: 1.1,
  },
  appSubtitle: {
    marginTop: 6,
    color: "#64748b",
    fontSize: 15,
  },
  topRight: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  primaryButton: {
    background: "#0b173d",
    color: "#fff",
    border: "none",
    borderRadius: 14,
    padding: "14px 28px",
    fontWeight: 700,
    cursor: "pointer",
  },
  secondaryButton: {
    background: "#fff",
    color: "#0f172a",
    border: "1px solid #cbd5e1",
    borderRadius: 12,
    padding: "12px 16px",
    fontWeight: 600,
    cursor: "pointer",
  },
  toolbar: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
    alignItems: "center",
  },
  search: {
    flex: 1,
    background: "#fff",
    border: "1px solid #cbd5e1",
    borderRadius: 14,
    padding: "14px 16px",
    fontSize: 15,
  },
  zoomButtons: {
    display: "flex",
    gap: 8,
  },
  notice: {
    background: "#f6e7b1",
    color: "#92400e",
    borderRadius: 16,
    padding: "12px 14px",
    fontSize: 14,
    marginBottom: 12,
  },
  noticeSoft: {
    background: "#e0f2fe",
    color: "#075985",
    borderRadius: 16,
    padding: "12px 14px",
    fontSize: 14,
    marginBottom: 12,
  },
  error: {
    background: "#fee2e2",
    color: "#b91c1c",
    borderRadius: 16,
    padding: "12px 14px",
    fontSize: 14,
    marginBottom: 12,
  },
  boardOuter: {
    overflow: "auto",
    background: "#fff",
    borderRadius: 24,
    border: "1px solid #e2e8f0",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  },
  boardInner: {
    minWidth: 2600,
    transformOrigin: "top left",
    padding: 24,
  },
  banner: {
    borderRadius: 24,
    background: "linear-gradient(90deg, #173a8a, #2f7ae5)",
    color: "#fff",
    textAlign: "center",
    padding: "18px 16px",
    marginBottom: 24,
  },
  bannerSmall: {
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    opacity: 0.95,
  },
  bannerBig: {
    fontSize: 38,
    fontWeight: 900,
    margin: "6px 0",
  },
  bracketGrid: {
    display: "grid",
    gridTemplateColumns: "420px 200px 180px 280px 180px 200px 420px",
    gap: 18,
    alignItems: "start",
  },
  regionColumn: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  regionTitle: {
    textAlign: "center",
    fontSize: 34,
    fontWeight: 900,
    margin: "8px 0 10px",
  },
  futureColumn: {
    display: "flex",
    flexDirection: "column",
    gap: 18,
  },
  centerColumn: {
    display: "flex",
    flexDirection: "column",
    gap: 18,
    paddingTop: 120,
  },
  futureTitle: {
    textAlign: "center",
    fontSize: 12,
    fontWeight: 800,
    color: "#64748b",
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  futureBox: {
    border: "1px dashed #cbd5e1",
    background: "#f8fafc",
    borderRadius: 14,
    padding: 12,
    color: "#94a3b8",
    fontSize: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
  },
  championshipBox: {
    background: "#0b173d",
    color: "#fff",
    borderRadius: 28,
    padding: 20,
    display: "flex",
    flexDirection: "column",
    gap: 14,
    boxShadow: "0 10px 30px rgba(11,23,61,0.15)",
  },
  champSmall: {
    fontSize: 11,
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: "0.2em",
    color: "#cbd5e1",
    fontWeight: 800,
  },
  champBig: {
    fontSize: 26,
    textAlign: "center",
    fontWeight: 900,
    textTransform: "uppercase",
  },
  matchupBox: {
    width: "100%",
    background: "#fff",
    border: "1px solid #475569",
    borderRadius: 14,
    textAlign: "left",
    cursor: "pointer",
    overflow: "hidden",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
  },
  boxTop: {
    fontSize: 10,
    color: "#64748b",
    padding: "8px 10px 6px",
    borderBottom: "1px solid #e2e8f0",
  },
  boxBody: {
    padding: "8px 10px",
  },
  rowDivider: {
    height: 1,
    background: "#f1f5f9",
    margin: "4px 0",
  },
  teamRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
    fontSize: 12,
  },
  teamName: {
    minWidth: 0,
    display: "flex",
    alignItems: "center",
    gap: 4,
    flex: "0 1 auto",
    overflow: "hidden",
  },
  seed: {
    color: "#64748b",
    width: 16,
    flexShrink: 0,
  },
  teamNameText: {
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  rightLine: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    whiteSpace: "nowrap",
    fontSize: 11,
    marginLeft: 4,
  },
  dot: {
    color: "#94a3b8",
  },
  score: {
    fontWeight: 700,
  },
  boxBottom: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 10,
    color: "#64748b",
    background: "#f8fafc",
    padding: "6px 10px",
  },
  placeholderBox: {
    border: "1px dashed #cbd5e1",
    background: "#f8fafc",
    borderRadius: 14,
    padding: 14,
    color: "#94a3b8",
    fontSize: 12,
  },
  placeholderTitle: {
    marginBottom: 6,
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    zIndex: 1000,
  },
  modalCard: {
    width: "100%",
    maxWidth: 900,
    maxHeight: "92vh",
    overflow: "auto",
    background: "#fff",
    borderRadius: 28,
    boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    padding: 20,
    borderBottom: "1px solid #e2e8f0",
    position: "sticky",
    top: 0,
    background: "#fff",
  },
  modalSmall: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: 800,
  },
  closeButton: {
    background: "#fff",
    border: "1px solid #cbd5e1",
    borderRadius: 12,
    padding: "10px 14px",
    fontWeight: 600,
    cursor: "pointer",
  },
  modalSection: {
    padding: 20,
    background: "#f8fafc",
  },
  modalInfoRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    fontSize: 14,
    color: "#64748b",
    marginBottom: 12,
  },
  modalTeamCard: {
    background: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  modalOddsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 12,
    padding: 20,
  },
  statBox: {
    background: "#f1f5f9",
    borderRadius: 18,
    padding: 16,
    fontSize: 14,
  },
  statLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: "0.14em",
    color: "#64748b",
    marginBottom: 8,
    fontWeight: 700,
  },
};
