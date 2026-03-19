import { useEffect, useMemo, useState } from 'react'

const regionOrder = ['East', 'South', 'West', 'Midwest']

const sampleGames = [
  { id: '1', region: 'East', round: 'First Round', seedAway: 16, away_team: 'Siena', seedHome: 1, home_team: 'Duke', commence_time: '2026-03-19T18:50:00Z', status: 'pregame', score: null, locked: false, odds: { moneyline: { Duke: -4000, Siena: 1400 }, spread: { Duke: -23.5, Siena: 23.5 }, total: 144.5 } },
  { id: '2', region: 'East', round: 'First Round', seedAway: 9, away_team: 'TCU', seedHome: 8, home_team: 'Ohio St.', commence_time: '2026-03-19T16:15:00Z', status: 'pregame', score: null, locked: false, odds: { moneyline: { 'Ohio St.': -120, TCU: 100 }, spread: { 'Ohio St.': -1.5, TCU: 1.5 }, total: 139.5 } },
  { id: '3', region: 'South', round: 'First Round', seedAway: 12, away_team: 'Northern Iowa', seedHome: 5, home_team: "St. John's", commence_time: '2026-03-19T23:10:00Z', status: 'pregame', score: null, locked: false, odds: { moneyline: { "St. John's": -230, 'Northern Iowa': 185 }, spread: { "St. John's": -5.5, 'Northern Iowa': 5.5 }, total: 136.5 } },
  { id: '4', region: 'Midwest', round: 'First Round', seedAway: 15, away_team: 'Vermont', seedHome: 2, home_team: 'Purdue', commence_time: '2026-03-20T01:20:00Z', status: 'pregame', score: null, locked: false, odds: { moneyline: { Purdue: -1200, Vermont: 700 }, spread: { Purdue: -16.5, Vermont: 16.5 }, total: 144.5 } },
]

function formatET(dateString) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/New_York',
  }).format(new Date(dateString))
}

function ml(value) {
  if (value === null || value === undefined) return '-'
  return value > 0 ? `+${value}` : `${value}`
}

function getLockedStatus(game) {
  const now = new Date()
  const tip = new Date(game.commence_time)
  return now >= tip || game.status === 'live' || game.status === 'final'
}

function buildBracketGames(games) {
  const first32 = games.slice(0, 32)
  const padded = [...first32]

  while (padded.length < 32) {
    padded.push({
      id: `empty-${padded.length + 1}`,
      region: regionOrder[Math.floor(padded.length / 8)] || 'East',
      round: 'First Round',
      seedAway: '-',
      away_team: 'TBD',
      seedHome: '-',
      home_team: 'TBD',
      commence_time: new Date().toISOString(),
      status: 'pregame',
      score: null,
      locked: false,
      odds: { moneyline: {}, spread: {}, total: '-' },
      isPlaceholder: true,
    })
  }

  return regionOrder.map((region, regionIndex) => ({
    region,
    games: padded.slice(regionIndex * 8, regionIndex * 8 + 8).map((game) => ({
      ...game,
      region,
    })),
  }))
}

function MatchupBox({ game, onClick }) {
  if (game.isPlaceholder) {
    return (
      <div className="matchup placeholder">
        <div className="placeholder-title">Matchup slot</div>
        <div>TBD vs TBD</div>
      </div>
    )
  }

  return (
    <button onClick={() => onClick(game)} className="matchup">
      <div className="matchup-time">{formatET(game.commence_time)}</div>

      <div className="team-row">
        <div className="team-name"><span className="seed">{game.seedAway}</span>{game.away_team}</div>
        <div className="team-meta">
          <span>{ml(game.odds.moneyline?.[game.away_team])}</span>
          <span className="dot">•</span>
          <span>{ml(game.odds.spread?.[game.away_team])}</span>
          <span className="dot">•</span>
          <span>{game.odds.total ?? '-'}</span>
          <span className="dot">•</span>
          <strong>{game.score?.[game.away_team] ?? '-'}</strong>
        </div>
      </div>

      <div className="team-row team-row-border">
        <div className="team-name"><span className="seed">{game.seedHome}</span>{game.home_team}</div>
        <div className="team-meta">
          <span>{ml(game.odds.moneyline?.[game.home_team])}</span>
          <span className="dot">•</span>
          <span>{ml(game.odds.spread?.[game.home_team])}</span>
          <span className="dot">•</span>
          <span>{game.odds.total ?? '-'}</span>
          <span className="dot">•</span>
          <strong>{game.score?.[game.home_team] ?? '-'}</strong>
        </div>
      </div>

      <div className="matchup-footer">
        <span>{game.status}</span>
        <span>{getLockedStatus(game) ? 'locked' : 'updating'}</span>
      </div>
    </button>
  )
}

function DetailModal({ game, onClose }) {
  if (!game) return null

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-subtitle">{game.region} • {game.round}</div>
            <div className="modal-title">{game.away_team} vs {game.home_team}</div>
          </div>
          <button className="button secondary" onClick={onClose}>Close</button>
        </div>

        <div className="summary-box">
          <div className="summary-top">
            <span>{formatET(game.commence_time)}</span>
            <span>{getLockedStatus(game) ? 'Odds locked' : 'Odds updating'}</span>
          </div>
          <div className="summary-team"><span><span className="seed">{game.seedAway}</span>{game.away_team}</span><strong>{game.score?.[game.away_team] ?? '-'}</strong></div>
          <div className="summary-team"><span><span className="seed">{game.seedHome}</span>{game.home_team}</span><strong>{game.score?.[game.home_team] ?? '-'}</strong></div>
        </div>

        <div className="odds-grid">
          <div className="odds-box">
            <div className="odds-label">Moneyline</div>
            <div>{game.away_team}: {ml(game.odds.moneyline?.[game.away_team])}</div>
            <div>{game.home_team}: {ml(game.odds.moneyline?.[game.home_team])}</div>
          </div>
          <div className="odds-box">
            <div className="odds-label">Spread</div>
            <div>{game.away_team}: {ml(game.odds.spread?.[game.away_team])}</div>
            <div>{game.home_team}: {ml(game.odds.spread?.[game.home_team])}</div>
          </div>
          <div className="odds-box">
            <div className="odds-label">Total</div>
            <div className="big-number">{game.odds.total ?? '-'}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [apiKey] = useState("");
  const [games, setGames] = useState(sampleGames)
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const [selectedGame, setSelectedGame] = useState(null)
  const [zoom, setZoom] = useState(1)
  const [useSampleData, setUseSampleData] = useState(true)

  async function loadOdds() {
   

    setLoading(true)
    setError('')

    try {
      const url = "/api/odds";
      const res = await fetch(url)
      if (!res.ok) throw new Error(`Request failed: ${res.status}`)
      const data = await res.json()

      const mapped = data.map((game, index) => {
        const firstBook = game.bookmakers?.[0]
        const markets = firstBook?.markets || []
        const h2h = markets.find((m) => m.key === 'h2h')
        const spreads = markets.find((m) => m.key === 'spreads')
        const totals = markets.find((m) => m.key === 'totals')

        const moneyline = Object.fromEntries((h2h?.outcomes || []).map((o) => [o.name, o.price]))
        const spread = Object.fromEntries((spreads?.outcomes || []).map((o) => [o.name, o.point]))
        const totalPoint = totals?.outcomes?.[0]?.point ?? null
        const region = regionOrder[index % regionOrder.length]
        const hasStarted = new Date() >= new Date(game.commence_time)

        return {
          id: game.id,
          region,
          round: 'First Round',
          seedAway: '-',
          away_team: game.away_team,
          seedHome: '-',
          home_team: game.home_team,
          commence_time: game.commence_time,
          status: hasStarted ? 'live' : 'pregame',
          score: null,
          locked: hasStarted,
          odds: { moneyline, spread, total: totalPoint },
        }
      })

      setGames((oldGames) => {
        const oldById = Object.fromEntries(oldGames.map((g) => [g.id, g]))
        return mapped.map((g) => {
          const old = oldById[g.id]
          if (old && getLockedStatus(old)) {
            return { ...old, locked: true }
          }
          return { ...g, locked: getLockedStatus(g) }
        })
      })
      setUseSampleData(false)
    } catch (err) {
      setError(err.message || 'Failed to load odds.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setInterval(() => {
      if (!useSampleData) loadOdds()
    }, 60 * 60 * 1000)
    return () => clearInterval(timer)
  }, [useSampleData, apiKey])

  const filteredGames = useMemo(() => {
    return games.filter((g) => `${g.away_team} ${g.home_team} ${g.region}`.toLowerCase().includes(query.toLowerCase()))
  }, [games, query])

  const grouped = useMemo(() => buildBracketGames(filteredGames), [filteredGames])

  return (
    <div className="page">
      <div className="top-card">
        <div>
          <div className="title">March Madness Bracket App</div>
          <div className="subtitle">Bracket view, clickable games, and pregame odds that update until tip-off.</div>
        </div>

        <div className="top-controls">
        
          <button onClick={loadOdds} className="button" disabled={loading}>{loading ? 'Loading' : 'Load odds'}</button>
        </div>
      </div>

      <div className="toolbar">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search team or region" className="input" />
        <div className="zoom-buttons">
          <button className="button secondary" onClick={() => setZoom((z) => Math.max(0.75, +(z - 0.1).toFixed(2)))}>Zoom out</button>
          <button className="button secondary" onClick={() => setZoom((z) => Math.min(1.6, +(z + 0.1).toFixed(2)))}>Zoom in</button>
        </div>
      </div>

      <div className="notice">Odds refresh once every hour before tip-off. After tip-off, that game locks. Real live scores still need a second scores source later.</div>
      {error ? <div className="error-box">{error}</div> : null}

      <div className="board-shell">
        <div className="board" style={{ transform: `scale(${zoom})` }}>
          <div className="board-banner">
            <div className="board-small">2026 NCAA Division I Men’s Basketball Championship</div>
            <div className="board-big">Interactive Bracket</div>
            <div className="board-small">Click a matchup box to open it bigger</div>
          </div>

          <div className="board-grid">
            <div className="column-stack">
              {grouped.filter((g) => g.region === 'East' || g.region === 'South').map((group) => (
                <div key={group.region}>
                  <div className="region-title">{group.region}</div>
                  <div className="matchup-stack">
                    {group.games.map((game) => <MatchupBox key={game.id} game={game} onClick={setSelectedGame} />)}
                  </div>
                </div>
              ))}
            </div>

            <div className="center-panel">
              <div className="center-card">
                <div className="board-small">Final Four</div>
                <div className="center-title">Championship</div>
                <div className="center-note">Semifinals and title game can go here next.</div>
              </div>
            </div>

            <div className="column-stack">
              {grouped.filter((g) => g.region === 'West' || g.region === 'Midwest').map((group) => (
                <div key={group.region}>
                  <div className="region-title">{group.region}</div>
                  <div className="matchup-stack">
                    {group.games.map((game) => <MatchupBox key={game.id} game={game} onClick={setSelectedGame} />)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <DetailModal game={selectedGame} onClose={() => setSelectedGame(null)} />
    </div>
  )
}
