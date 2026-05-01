"use client";
import { useState, useEffect } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";

const ADMIN = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

export default function AdminPage() {
  const [user, setUser]         = useState(null);
  const [token, setToken]       = useState("");
  const [log, setLog]           = useState([]);
  const [running, setRunning]   = useState("");
  const [gifted, setGifted]     = useState([]);
  const [newEmail, setNewEmail] = useState("");
  const [newPlan, setNewPlan]   = useState("pro");
  const [giftMsg, setGiftMsg]   = useState("");
  const sb = getSupabaseClient();

  useEffect(() => {
    sb.auth.getUser().then(({ data }) => setUser(data?.user || null));
    sb.auth.getSession().then(({ data }) => setToken(data?.session?.access_token || ""));
  }, []);

  useEffect(() => { if (token) loadGifted(); }, [token]);

  const loadGifted = () => {
    fetch("/api/admin/gift", { headers: { Authorization: "Bearer " + token } })
      .then(r => r.json()).then(d => setGifted(d.gifted || [])).catch(() => {});
  };

  const addLog = (label, body) => {
    const ts = new Date().toLocaleTimeString();
    const msg = typeof body === "string" ? body : JSON.stringify(body, null, 2);
    const line = "[" + ts + "] " + label + ": " + msg
    setLog(l => [line, ...l]);
  };

  const runStep = async (endpoint, label) => {
    setRunning(label);
    addLog(label, "Starting...");
    try {
      const res = await fetch(endpoint, {
        headers: { Authorization: "Bearer " + process.env.NEXT_PUBLIC_CRON_SECRET }
      });
      addLog(label, await res.json());
    } catch (e) {
      addLog(label + " ERROR", e.message);
    }
    setRunning("");
  };

  const triggerNow = async () => {
    setRunning("pipeline");
    setLog([]);
    addLog("Pipeline", "Starting full run...");
    try {
      const res = await fetch("/api/cron/morning", {
        headers: { Authorization: "Bearer " + process.env.NEXT_PUBLIC_CRON_SECRET }
      });
      const body = await res.json();
      addLog("Morning run", body);
      addLog("Done", "Refresh Today and Tipsters pages to see data.");
    } catch (e) {
      addLog("Pipeline ERROR", e.message);
    }
    setRunning("");
  };

  const grantAccess = async () => {
    if (!newEmail.trim()) return;
    setGiftMsg("");
    const res = await fetch("/api/admin/gift", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify({ email: newEmail.trim(), plan: newPlan }),
    });
    const d = await res.json();
    if (d.ok) { setGiftMsg("Access granted to " + newEmail); setNewEmail(""); loadGifted(); }
    else { setGiftMsg("Error: " + (d.error || "unknown")); }
  };

  const revokeAccess = async email => {
    await fetch("/api/admin/gift", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify({ email }),
    });
    loadGifted();
  };

  if (!user || user.email !== ADMIN) {
    return (
      <div style={{ paddingTop: 32, textAlign: "center", color: "var(--muted)" }}>
        Admin access restricted.
      </div>
    );
  }

  const manualSteps = [
    { label: "Fetch Results",  endpoint: "/api/results/fetch" },
    { label: "Settle Picks",   endpoint: "/api/personas/settle" },
    { label: "Rebuild Cache",  endpoint: "/api/cron/cache" },
    { label: "Midnight Swap",  endpoint: "/api/cron/midnight" },
  ];

  return (
    <div style={{ paddingTop: 16 }}>
      <h1 className="section-title">Admin Panel</h1>

      <div className="card" style={{ borderTop: "3px solid var(--green)", marginBottom: 16 }}>
        <div style={{ fontFamily: "Bebas Neue, sans-serif", fontSize: 20, marginBottom: 6 }}>
          Populate Site With Data
        </div>
        <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>
          Fetches racecards, scores runners, builds cache, generates picks, pulls yesterday results.
        </div>
        <button onClick={triggerNow} className="btn btn-green btn-full"
          disabled={!!running} style={{ fontSize: 16, padding: "14px 20px" }}>
          {running === "pipeline" ? "Running — please wait..." : "Start Now"}
        </button>
        {running === "pipeline" && (
          <div style={{ fontSize: 12, color: "var(--muted)", textAlign: "center", marginTop: 8 }}>
            Takes 30-60 seconds. Do not close the page.
          </div>
        )}
      </div>

      {log.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
            Output Log
          </div>
          <div style={{ fontFamily: "monospace", fontSize: 11, color: "var(--muted)", maxHeight: 300, overflowY: "auto", background: "var(--surface2)", borderRadius: 6, padding: 12 }}>
            {log.map((l, i) => (
              <div key={i} style={{ marginBottom: 6, paddingBottom: 6, borderBottom: "1px solid var(--border)", wordBreak: "break-all" }}>
                {l}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12 }}>
          Individual Steps
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {manualSteps.map(a => (
            <button key={a.label} onClick={() => runStep(a.endpoint, a.label)}
              className="btn btn-ghost" disabled={!!running}
              style={{ fontSize: 12, padding: "8px 14px" }}>
              {running === a.label ? "Running..." : a.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12 }}>
          Gift Free Access
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
          <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)}
            placeholder="email@example.com" style={{ flex: 1, minWidth: 180 }} />
          <select value={newPlan} onChange={e => setNewPlan(e.target.value)}
            style={{ width: "auto", flex: "none", padding: "12px 14px" }}>
            <option value="pro">Pro</option>
            <option value="edge">Edge</option>
          </select>
          <button onClick={grantAccess} className="btn btn-green" style={{ fontSize: 13 }}>Grant</button>
        </div>
        {giftMsg && (
          <div style={{ fontSize: 13, color: giftMsg.startsWith("Error") ? "var(--red)" : "var(--green)", marginBottom: 12 }}>
            {giftMsg}
          </div>
        )}
        {gifted.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>Gifted access ({gifted.length})</div>
            {gifted.map(g => (
              <div key={g.email} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border)", flexWrap: "wrap", gap: 8 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{g.email}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                    <span className={"badge " + (g.plan === "edge" ? "badge-green" : "badge-blue")} style={{ marginRight: 6 }}>{g.plan}</span>
                    {g.expires_at ? "Expires " + new Date(g.expires_at).toLocaleDateString("en-GB") : "No expiry"}
                  </div>
                </div>
                <button onClick={() => revokeAccess(g.email)} className="btn btn-ghost"
                  style={{ fontSize: 11, padding: "4px 10px", color: "var(--red)", borderColor: "var(--red)" }}>
                  Revoke
                </button>
              </div>
            ))}
          </div>
        )}
        {gifted.length === 0 && <div style={{ fontSize: 13, color: "var(--muted)" }}>No gifted access yet.</div>}
      </div>

      <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(163,230,53,0.07)", border: "1px solid rgba(163,230,53,0.2)", borderRadius: "var(--radius)", fontSize: 12, color: "var(--muted)" }}>
        Your account ({ADMIN}) has permanent Edge access.
      </div>
    </div>
  );
}
