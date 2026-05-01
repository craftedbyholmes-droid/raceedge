"use client";
import { useState } from "react";
import Link from "next/link";
import { getSupabaseClient } from "@/lib/supabaseClient";

export default function LandingPage() {
  const [mode, setMode]       = useState("login");
  const [email, setEmail]     = useState("");
  const [password, setPw]     = useState("");
  const [confirm, setConfirm] = useState("");
  const [checks, setChecks]   = useState({ terms: false, gdpr: false, age: false, marketing: false });
  const [status, setStatus]   = useState({ msg: "", type: "" });
  const [loading, setLoading] = useState(false);

  const chk = k => setChecks(c => Object.assign({}, c, { [k]: !c[k] }));

  const handle = async e => {
    e.preventDefault();
    setStatus({ msg: "", type: "" });
    if (mode === "signup") {
      if (!checks.terms || !checks.gdpr || !checks.age) {
        setStatus({ msg: "Please accept all required agreements.", type: "err" });
        return;
      }
      if (password !== confirm) {
        setStatus({ msg: "Passwords do not match.", type: "err" });
        return;
      }
    }
    setLoading(true);
    try {
      const sb = getSupabaseClient();
      if (mode === "login") {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.href = "/dashboard";
      } else {
        const { error } = await sb.auth.signUp({
          email, password,
          options: { data: { email_marketing: checks.marketing } },
        });
        if (error) throw error;
        setStatus({ msg: "Account created! Check your email to confirm, then sign in.", type: "ok" });
        setMode("login");
      }
    } catch (err) {
      setStatus({ msg: err.message, type: "err" });
    }
    setLoading(false);
  };

  return (
    <div style={{ paddingTop: 32 }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ fontFamily: "Bebas Neue, sans-serif", fontSize: 52, letterSpacing: 4, lineHeight: 1 }}>
          <span style={{ color: "var(--green)" }}>RACE</span>
          <span style={{ color: "var(--text)" }}>EDGE</span>
        </div>
        <div style={{ fontSize: 13, color: "var(--muted)", letterSpacing: 2, textTransform: "uppercase", marginTop: 8 }}>
          AI-Powered UK Racing Tips
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 32, marginTop: 20, flexWrap: "wrap" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "Bebas Neue, sans-serif", fontSize: 22, color: "var(--robbie)" }}>RAMBLING ROBBIE</div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>Jumps Specialist - Chase and Hurdle</div>
          </div>
          <div style={{ width: 1, background: "var(--border)" }} />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "Bebas Neue, sans-serif", fontSize: 22, color: "var(--pat)" }}>PUNTER PAT</div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>Flat Racing Expert</div>
          </div>
        </div>
        <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 10 }}>1 pick each per day - £5 each way</div>
      </div>

      <div className="card" style={{ maxWidth: 420, margin: "0 auto" }}>
        <div className="tabs" style={{ marginBottom: 20 }}>
          <div className={"tab" + (mode === "login"  ? " active" : "")} onClick={() => setMode("login")}>Sign In</div>
          <div className={"tab" + (mode === "signup" ? " active" : "")} onClick={() => setMode("signup")}>Create Account</div>
        </div>

        {status.msg && (
          <div style={{
            padding: "10px 12px", borderRadius: "var(--radius)", marginBottom: 16, fontSize: 13,
            background: status.type === "ok" ? "rgba(163,230,53,0.1)" : "rgba(239,68,68,0.1)",
            color:      status.type === "ok" ? "var(--green)" : "var(--red)",
            border:     "1px solid " + (status.type === "ok" ? "var(--green)" : "var(--red)"),
          }}>
            {status.msg}
          </div>
        )}

        <form onSubmit={handle}>
          <div style={{ marginBottom: 12 }}>
            <label>Email address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com" required autoComplete="email" />
          </div>
          <div style={{ marginBottom: mode === "signup" ? 12 : 20 }}>
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPw(e.target.value)}
              placeholder="Enter password" required
              autoComplete={mode === "login" ? "current-password" : "new-password"} />
          </div>

          {mode === "signup" && (
            <>
              <div style={{ marginBottom: 20 }}>
                <label>Confirm Password</label>
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                  placeholder="Repeat password" required autoComplete="new-password" />
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
                  Required Agreements
                </div>
                <div className="check-row">
                  <input type="checkbox" id="ck-terms" checked={checks.terms} onChange={() => chk("terms")} />
                  <label htmlFor="ck-terms">
                    I agree to the <Link href="/terms" target="_blank">Terms and Conditions</Link> and <Link href="/privacy" target="_blank">Privacy Policy</Link>
                    <span style={{ color: "var(--red)" }}> *</span>
                  </label>
                </div>
                <div className="check-row">
                  <input type="checkbox" id="ck-gdpr" checked={checks.gdpr} onChange={() => chk("gdpr")} />
                  <label htmlFor="ck-gdpr">
                    I consent to my data being processed under UK GDPR as described in the <Link href="/privacy" target="_blank">Privacy Policy</Link>
                    <span style={{ color: "var(--red)" }}> *</span>
                  </label>
                </div>
                <div className="check-row">
                  <input type="checkbox" id="ck-age" checked={checks.age} onChange={() => chk("age")} />
                  <label htmlFor="ck-age">
                    I confirm I am 18 years of age or older
                    <span style={{ color: "var(--red)" }}> *</span>
                  </label>
                </div>
                <div className="check-row" style={{ borderBottom: "none" }}>
                  <input type="checkbox" id="ck-mkt" checked={checks.marketing} onChange={() => chk("marketing")} />
                  <label htmlFor="ck-mkt">I would like to receive tips and updates by email (optional)</label>
                </div>
              </div>
              <div style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "var(--radius)", padding: "10px 12px", marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#ef4444", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>
                  Responsible Gambling
                </div>
                <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>
                  Tips are for entertainment only. Never bet more than you can afford to lose.
                  Help: <a href="https://www.begambleaware.org" target="_blank" rel="noopener noreferrer" style={{ color: "var(--blue)" }}>BeGambleAware.org</a> or <a href="tel:08088020133" style={{ color: "var(--blue)" }}>0808 802 0133</a>
                </div>
              </div>
            </>
          )}

          <button type="submit" className="btn btn-green btn-full" disabled={loading}>
            {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>

        {mode === "login" && (
          <div style={{ textAlign: "center", marginTop: 14, fontSize: 13, color: "var(--muted)" }}>
            No account?{" "}
            <button onClick={() => setMode("signup")}
              style={{ background: "none", border: "none", color: "var(--blue)", cursor: "pointer", fontSize: 13 }}>
              Create one free
            </button>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 28, flexWrap: "wrap" }}>
        {[
          { label: "AI Scoring",      desc: "11-factor model scores every runner" },
          { label: "Robbie",          desc: "Jumps specialist, 1 pick daily" },
          { label: "Pat",             desc: "Flat expert, 1 pick daily" },
          { label: "P&L Archive",     desc: "Monthly history, every result" },
        ].map(f => (
          <div key={f.label} className="card" style={{ flex: 1, minWidth: 110, textAlign: "center", padding: 12 }}>
            <div style={{ fontFamily: "Bebas Neue, sans-serif", fontSize: 16, color: "var(--green)", marginBottom: 4 }}>{f.label}</div>
            <div style={{ fontSize: 11, color: "var(--muted)" }}>{f.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}