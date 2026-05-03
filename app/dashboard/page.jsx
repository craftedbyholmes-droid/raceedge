"use client";
import { useState, useEffect, useCallback } from "react";
import { useOdds, OddsToggleButton } from "@/components/OddsToggle";
import { usePlan } from "@/lib/usePlan";
import { fracToDecimal } from "@/lib/odds";

function ScoreBadge({ score }) {
  const s = Math.round(score || 0);
  const colour = s >= 75 ? "var(--gold)" : s >= 68 ? "var(--green)" : "var(--muted)";
  return (
    <div style={{ textAlign: "center", minWidth: 48 }}>
      <div style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", marginBottom: 2 }}>Score</div>
      <div style={{ fontFamily: "Bebas Neue, sans-serif", fontSize: 26, lineHeight: 1, color: colour }}>{s}</div>
    </div>
  );
}

function OddsDisplay({ fractional, decimal, bookmaker, mode }) {
  const val = mode === "decimal"
    ? (fracToDecimal(fractional) ? fracToDecimal(fractional).toFixed(2) : null)
    : fractional;
  return (
    <div style={{ textAlign: "center", minWidth: 52 }}>
      <div style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", marginBottom: 2 }}>Odds</div>
      <div style={{ fontFamily: "Barlow Condensed, sans-serif", fontWeight: 700, fontSize: 18, color: val ? "var(--gold)" : "var(--muted)" }}>
        {val || "N/A"}
      </div>
    </div>
  );
}

function RunnerCard({ runner, mode, affUrl }) {
  return (
    <div style={{ background: "var(--surface2)", borderRadius: "var(--radius)", padding: "12px 14px", marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
        <div style={{ flex: 1, minWidth: 160 }}>
          <div style={{ fontFamily: "Barlow Condensed, sans-serif", fontWeight: 700, fontSize: 16 }}>
            {runner.horse_name}
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 3, lineHeight: 1.5 }}>
            <span>Jockey: <strong style={{ color: "var(--text)" }}>{runner.jockey || "TBC"}</strong></span>
            <span style={{ margin: "0 6px" }}>·</span>
            <span>Trainer: <strong style={{ color: "var(--text)" }}>{runner.trainer || "TBC"}</strong></span>
            {runner.draw ? <><span style={{ margin: "0 6px" }}>·</span><span>Draw: <strong style={{ color: "var(--text)" }}>{runner.draw}</strong></span></> : null}
            {runner.form ? <><span style={{ margin: "0 6px" }}>·</span><span>Form: <strong style={{ color: "var(--text)" }}>{runner.form}</strong></span></> : null}
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexShrink: 0 }}>
          <ScoreBadge score={runner.total} />
          <OddsDisplay
            fractional={runner.best_fractional}
            decimal={runner.best_decimal}
            bookmaker={runner.best_bookmaker}
            mode={mode}
          />
          <a href={affUrl} target="_blank" rel="noopener noreferrer sponsored"
            className="btn btn-green" style={{ padding: "7px 14px", fontSize: 13 }}>
            Bet365
          </a>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [races, setRaces]       = useState([]);
  const [freeTip, setFreeTip]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState({});
  const { mode } = useOdds();
  const { plan, loading: planLoading } = usePlan();
  const affUrl = process.env.NEXT_PUBLIC_AFF_BET365 || "https://www.bet365.com";

  const loadData = useCallback(() => {
    if (planLoading) return;
    if (plan === "free") {
      fetch("/api/free-tip")
        .then(r => r.json())
        .then(d => { setFreeTip(d.tip || null); setLoading(false); });
    } else {
      fetch("/api/races?plan=" + plan)
        .then(r => r.json())
        .then(d => { setRaces(d.races || []); setLoading(false); });
    }
  }, [plan, planLoading]);

  useEffect(() => { loadData(); }, [loadData]);

  // Refresh every 10 minutes
  useEffect(() => {
    const iv = setInterval(loadData, 600000);
    return () => clearInterval(iv);
  }, [loadData]);

  const toggle = id => setExpanded(e => Object.assign({}, e, { [id]: !e[id] }));
  const highConf = races.flatMap(r => r.runners || []).filter(r => r.total >= 75).length;
  const strong   = races.flatMap(r => r.runners || []).filter(r => r.total >= 68).length;

  if (plan === "free") {
    return (
      <div style={{ paddingTop: 16 }}>
        <h1 className="section-title">Today's Top Tip</h1>
        <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 16 }}>
          {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
        </div>
        {loading && <div style={{ textAlign: "center", color: "var(--muted)", padding: 40 }}>Loading...</div>}
        {!loading && !freeTip && (
          <div className="card" style={{ textAlign: "center", padding: 32 }}>
            <div style={{ color: "var(--muted)", marginBottom: 8 }}>No tip generated yet today.</div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>Tips are generated at 07:00 each morning.</div>
          </div>
        )}
        {!loading && freeTip && (
          <div className="card" style={{ borderTop: "3px solid var(--gold)" }}>
            <div style={{ fontSize: 11, color: "var(--gold)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Morning Best Pick</div>
            <div style={{ fontFamily: "Bebas Neue, sans-serif", fontSize: 30, letterSpacing: 1 }}>{freeTip.horse_name}</div>
            <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 14 }}>{freeTip.course} · {freeTip.race_type}</div>
            <div style={{ display: "flex", gap: 24, marginBottom: 14, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase" }}>Odds</div>
                <div style={{ fontFamily: "Barlow Condensed, sans-serif", fontSize: 26, fontWeight: 700, color: "var(--gold)" }}>{freeTip.odds || "N/A"}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase" }}>Score</div>
                <div style={{ fontFamily: "Bebas Neue, sans-serif", fontSize: 26, color: "var(--green)" }}>{Math.round(freeTip.score || 0)}</div>
              </div>
            </div>
            {freeTip.tip_text && (
              <div style={{ fontSize: 13, fontStyle: "italic", color: "var(--muted)", borderTop: "1px solid var(--border)", paddingTop: 12, marginBottom: 14 }}>
                "{freeTip.tip_text}"
              </div>
            )}
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 16 }}>Suggested stake: £5 each way · Total £10</div>
            <a href={affUrl} target="_blank" rel="noopener noreferrer sponsored" className="btn btn-green">Bet on Bet365</a>
          </div>
        )}
        <div className="card" style={{ marginTop: 16, textAlign: "center", padding: 24 }}>
          <div style={{ fontFamily: "Bebas Neue, sans-serif", fontSize: 18, marginBottom: 8 }}>See All Races</div>
          <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 14 }}>Pro members see all races, full runner details, odds and both tipster picks.</div>
          <a href="/pricing" className="btn btn-blue">View Plans</a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
        <div>
          <h1 className="section-title" style={{ marginBottom: 2 }}>Today's Races</h1>
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
        <div className="stat-box"><div className="stat-val">{strong}</div><div className="stat-lbl">Strong</div></div>
      </div>

      {loading && <div style={{ textAlign: "center", color: "var(--muted)", padding: 40 }}>Loading races...</div>}
      {!loading && !races.length && (
        <div className="card" style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>
          No races loaded yet — racecards are fetched at 07:00 each morning.
        </div>
      )}

      {races.map(race => (
        <div key={race.race_id} className="card" style={{ cursor: "pointer" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
            onClick={() => toggle(race.race_id)}>
            <div style={{ flex: 1, minWidth: 0, paddingRight: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontFamily: "Bebas Neue, sans-serif", fontSize: 18, letterSpacing: 0.5 }}>{race.course}</span>
                <span style={{ fontSize: 12, color: "var(--muted)" }}>{race.off_time}</span>
                <span className="badge badge-grey">{race.race_type}</span>
                {(race.runners || []).some(r => r.total >= 75) && <span className="badge badge-gold">HIGH CONFIDENCE</span>}
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {race.race_name} · {race.distance_furlongs}f · {race.going || "Going N/A"}
              </div>
            </div>
            <span style={{ color: "var(--muted)", fontSize: 18, flexShrink: 0 }}>{expanded[race.race_id] ? "▲" : "▼"}</span>
          </div>

          {expanded[race.race_id] && (
            <div style={{ marginTop: 14 }}>
              <div className="divider" style={{ marginTop: 0, marginBottom: 12 }} />
              {(race.runners || []).map(runner => (
                <RunnerCard key={runner.runner_id} runner={runner} mode={mode} affUrl={affUrl} />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
