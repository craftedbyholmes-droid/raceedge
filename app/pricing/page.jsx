"use client";
import { useState } from "react";

const plans = [
  {
    id: "free", label: "Free", price: "£0", sub: "Forever", colour: "var(--muted)",
    features: ["Top tip of the day", "Bookmaker links", "Results ticker"],
    locked: ["Full race cards", "Both tipster picks", "Results history"],
  },
  {
    id: "pro", label: "Pro", price: "£9.99", sub: "/month", colour: "var(--blue)",
    features: ["All races, top 2 runners per race", "Both tipster picks daily", "30-day results history", "Odds toggle (frac/dec)", "Monthly P&L archive"],
    locked: ["Live refresh", "Full history"],
  },
  {
    id: "edge", label: "Edge", price: "£24.99", sub: "/month", colour: "var(--green)",
    features: ["Everything in Pro", "Full results history", "Live refresh button", "Time and track filter"],
    locked: [],
  },
];

export default function PricingPage() {
  const [loading, setLoading] = useState("");

  const subscribe = async planId => {
    if (planId === "free") return;
    setLoading(planId);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch (e) {}
    setLoading("");
  };

  return (
    <div style={{ paddingTop: 16 }}>
      <h1 className="section-title">Plans</h1>
      <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 20 }}>
        All plans include Gamble Aware resources. Tips are for entertainment only. 18+ only.
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {plans.map(p => (
          <div key={p.id} className="card" style={{ borderTop: "3px solid " + p.colour }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
              <div>
                <div style={{ fontFamily: "Bebas Neue, sans-serif", fontSize: 22, letterSpacing: 1, color: p.colour }}>{p.label}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                  <span style={{ fontSize: 28, fontWeight: 800 }}>{p.price}</span>
                  <span style={{ fontSize: 13, color: "var(--muted)" }}>{p.sub}</span>
                </div>
              </div>
              <button
                onClick={() => subscribe(p.id)}
                className={"btn " + (p.id === "edge" ? "btn-green" : p.id === "pro" ? "btn-blue" : "btn-ghost")}
                disabled={loading === p.id || p.id === "free"}
                style={{ opacity: p.id === "free" ? 0.5 : 1 }}>
                {loading === p.id ? "Redirecting..." : p.id === "free" ? "Current Plan" : "Subscribe"}
              </button>
            </div>
            {p.features.map(f => (
              <div key={f} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                <span style={{ color: "var(--green)", fontWeight: 700 }}>✓</span>
                <span style={{ fontSize: 13 }}>{f}</span>
              </div>
            ))}
            {p.locked.map(f => (
              <div key={f} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6, opacity: 0.4 }}>
                <span style={{ color: "var(--muted)" }}>✗</span>
                <span style={{ fontSize: 13, color: "var(--muted)" }}>{f}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 24, padding: 16, background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: "var(--radius)" }}>
        <div style={{ fontFamily: "Barlow Condensed, sans-serif", fontWeight: 700, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.5px", color: "#ef4444", marginBottom: 6 }}>
          Responsible Gambling
        </div>
        <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6 }}>
          RaceEdge tips are for entertainment purposes only. Past performance does not guarantee future results.
          Never bet more than you can afford to lose.
          Help: <a href="https://www.begambleaware.org" target="_blank" rel="noopener noreferrer" style={{ color: "var(--blue)" }}>BeGambleAware.org</a>
          {" · "}<a href="https://www.gamstop.co.uk" target="_blank" rel="noopener noreferrer" style={{ color: "var(--blue)" }}>GamStop</a>
          {" · "}0808 802 0133
        </div>
      </div>
    </div>
  );
}
