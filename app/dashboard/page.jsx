"use client";
import { useState, useEffect } from "react";
import { useOdds, OddsToggleButton } from "@/components/OddsToggle";
import { usePlan } from "@/lib/usePlan";
import { fracToDecimal } from "@/lib/odds";

function PosBadge({ position, isNR }) {
  if (isNR)           return <span className="pos-nr">N/R</span>;
  if (!position)      return <span className="pos-pending">Pending</span>;
  if (position === 1) return <span className="pos-win">WON</span>;
  if (position <= 3)  return <span className="pos-place">{position}{["","st","nd","rd"][position] || "th"}</span>;
  return <span className="pos-unplace">{position}th</span>;
}

export default function DashboardPage() {
  const [races, setRaces]       = useState([]);
  const [freeTip, setFreeTip]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState({});
  const { mode } = useOdds();
  const { plan, loading: planLoading } = usePlan();

  useEffect(() => {
    if (planLoading) return;

    // Free users: load just the cached morning tip
    if (plan === "free") {
      fetch("/api/free-tip")
        .then(r => r.json())
        .then(d => { setFreeTip(d.tip || null); setLoading(false); });
      return;
    }

    // Pro/Edge: load full race card from cache
    fetch("/api/races?plan=" + plan)
      .then(r => r.json())
      .then(d => { setRaces(d.races || []); setLoading(false); });
  }, [plan, planLoading]);

  const fmt = frac => mode === "decimal" ? fracToDecimal(frac).toFixed(2) : (frac || "N/A");
  const highConf = races.flatMap(r => r.runners || []).filter(r => r.total >= 75).length;

  // ── FREE TIER VIEW ───────────────────────────────────────────
  if (plan === "free") {
    return (
      <div style={{ paddingTop: 16 }}>
        <h1 className="section-title">Today's Top Tip</h1>
        <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 16 }}>
          {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
        </div>

        {loading && (
          <div style={{ color: "var(--muted)", textAlign: "center", padding: 40 }}>Loading tip...</div>
        )}

        {!loading && !freeTip && (
          <div className="card" style={{ textAlign: "center", padding: 32, color: "var(--muted)" }}>
            <div style={{ fontSize: 18, marginBottom: 8 }}>No tip yet today</div>
            <div style={{ fontSize: 13 }}>Our morning pick is generated at 07:00. Check back then.</div>
          </div>
        )}

        {!loading && freeTip && (
          <div className="card" style={{ borderTop: "3px solid var(--gold)" }}>
            <div style={{ fontFamily: "Bebas Neue, sans-serif", fontSize: 11, letterSpacing: 2, color: "var(--gold)", textTransform: "uppercase", marginBottom: 8 }}>
              Morning Best Pick
            </div>
            <div style={{ fontFamily: "Bebas Neue, sans-serif", fontSize: 28, letterSpacing: 1, marginBottom: 4 }}>
              {freeTip.horse_name}
            </div>
            <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>
              {freeTip.course} &middot; {freeTip.race_type}
            </div>
            <div style={{ display: "flex", gap: 20, marginBottom: 12, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase" }}>Odds</div>
                <div style={{ fontFamily: "Barlow Condensed, sans-serif", fontSize: 24, fontWeight: 700, color: "var(--gold)" }}>{freeTip.odds || "N/A"}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase" }}>Score</div>
                <div style={{ fontFamily: "Bebas Neue, sans-serif", fontSize: 24, color: "var(--green)" }}>{Math.round(freeTip.score || 0)}</div>
              </div>
            </div>
            {freeTip.tip_text && (
              <div style={{ fontSize: 13, color: "var(--muted)", fontStyle: "italic", borderTop: "1px solid var(--border)", paddingTop: 10, marginBottom: 12 }}>
                "{freeTip.tip_text}"
              </div>
            )}
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 16 }}>
              Suggested stake: £5 each way &middot; Total £10
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <a href={process.env.NEXT_PUBLIC_AFF_BET365 || "https://www.bet365.com"}
                target="_blank" rel="noopener noreferrer sponsored"
                className="btn btn-green" style={{ fontSize: 13 }}>Bet on Bet365</a>
              <a href={process.env.NEXT_PUBLIC_AFF_WILLIAMHILL || "https://www.williamhill.com"}
                target="_blank" rel="noopener noreferrer sponsored"
                className="btn btn-ghost" style={{ fontSize: 13 }}>William Hill</a>
            </div>
          </div>
        )}

        <div className="card" style={{ marginTop: 16, textAlign: "center", padding: 24 }}>
          <div style={{ fontFamily: "Bebas Neue, sans-serif", fontSize: 18, marginBottom: 8 }}>Want More?</div>
          <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>
            Pro members see all races, top 2 runners per race, both tipster picks, and full results history.
          </div>
          <a href="/pricing" className="btn btn-blue">View Plans</a>
        </div>
      </div>
    );
  }

  // ── PRO / EDGE VIEW ──────────────────────────────────────────
  return (
    <div style={{ paddingTop: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
        <div>
          <h1 className="section-title" style={{ marginBottom: 0 }}>Today's Races</h1>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>
            {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <OddsToggleButton />
          <span className="badge badge-grey">{plan.toUpperCase()}</span>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-box"><div className="stat-val">{races.length}</div><div className="stat-lbl">Races</div></div>
        <div className="stat-box"><div className="stat-val" style={{ color: "var(--gold)" }}>{highConf}</div><div className="stat-lbl">High Conf</div></div>
        <div className="stat-box"><div className="stat-val">{races.flatMap(r => r.runners || []).filter(r => r.total >= 70).length}</div><div className="stat-lbl">Strong</div></div>
      </div>

      {loading && <div style={{ color: "var(--muted)", textAlign: "center", padding: 40 }}>Loading races...</div>}
      {!loading && races.length === 0 && (
        <div className="card" style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>
          No races loaded yet. Racecards are fetched at 07:00 each morning.
        </div>
      )}

      {races.map(race => (
        <div key={race.race_id} className="card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
            onClick={() => setExpanded(e => Object.assign({}, e, { [race.race_id]: !e[race.race_id] }))}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontFamily: "Bebas Neue, sans-serif", fontSize: 17 }}>{race.course}</span>
                <span style={{ fontSize: 12, color: "var(--muted)" }}>{race.off_time}</span>
                <span className="badge badge-grey">{race.race_type}</span>
                {(race.runners || []).some(r => r.total >= 75) && <span className="badge badge-gold">HIGH CONFIDENCE</span>}
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                {race.race_name} &middot; {race.distance_furlongs}f &middot; {race.going}
              </div>
            </div>
            <span style={{ color: "var(--muted)", fontSize: 18 }}>{expanded[race.race_id] ? "▲" : "▼"}</span>
          </div>

          {expanded[race.race_id] && (
            <div style={{ marginTop: 14 }}>
              <div className="divider" style={{ marginTop: 0 }} />
              {(race.runners || []).map(runner => (
                <div key={runner.runner_id} style={{ background: "var(--surface2)", borderRadius: "var(--radius)", padding: 12, marginBottom: 8, display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <div style={{ fontFamily: "Barlow Condensed, sans-serif", fontWeight: 700, fontSize: 15 }}>{runner.horse_name}</div>
                    <div style={{ fontSize: 11, color: "var(--muted)" }}>{runner.jockey} &middot; Draw {runner.draw || "N/A"}</div>
                  </div>
                  <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 10, color: "var(--muted)" }}>SCORE</div>
                      <div style={{ fontFamily: "Bebas Neue, sans-serif", fontSize: 22, color: runner.total >= 75 ? "var(--gold)" : runner.total >= 70 ? "var(--green)" : "var(--text)" }}>
                        {runner.total}
                      </div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 10, color: "var(--muted)" }}>ODDS</div>
                      <div style={{ fontFamily: "Barlow Condensed, sans-serif", fontWeight: 700, fontSize: 17, color: "var(--gold)" }}>
                        {fmt(runner.best_fractional)}
                      </div>
                    </div>
                    <a href={process.env.NEXT_PUBLIC_AFF_BET365 || "https://www.bet365.com"}
                      target="_blank" rel="noopener noreferrer sponsored"
                      className="btn btn-green" style={{ padding: "5px 12px", fontSize: 12 }}>Bet365</a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
