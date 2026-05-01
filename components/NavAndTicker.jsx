"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabaseClient";

const ADMIN = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

export default function NavAndTicker() {
  const [isMobile, setIsMobile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [tickerItems, setTickerItems] = useState([]);
  const [userEmail, setUserEmail] = useState("");
  const pathname = usePathname();

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 600);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  useEffect(() => {
    getSupabaseClient().auth.getUser().then(({ data }) => {
      setUserEmail(data?.user?.email || "");
    });
  }, []);

  useEffect(() => {
    const load = () =>
      fetch("/api/ticker")
        .then(r => r.json())
        .then(d => setTickerItems(d.items || []))
        .catch(() => {});
    load();
    const iv = setInterval(load, 3600000);
    return () => clearInterval(iv);
  }, []);

  const links = [
    { href: "/dashboard", label: "Today" },
    { href: "/tipsters",  label: "Tipsters" },
    { href: "/results",   label: "Results" },
    { href: "/pricing",   label: "Pricing" },
  ];

  const isActive = href => pathname === href || pathname.startsWith(href + "/");
  const isAdmin = userEmail === ADMIN;

  return (
    <>
      <nav className="nav">
        <Link href="/" className="nav-brand">Race<span>Edge</span></Link>

        {!isMobile && (
          <div className="nav-links">
            {links.map(l => (
              <Link key={l.href} href={l.href} className={isActive(l.href) ? "active" : ""}>
                {l.label}
              </Link>
            ))}
            {isAdmin && (
              <Link href="/admin" className={isActive("/admin") ? "active" : ""} style={{ color: "var(--gold)" }}>
                Admin
              </Link>
            )}
          </div>
        )}

        <div className="nav-right">
          {!isMobile && (
            <Link href="/account" className="btn btn-ghost" style={{ padding: "5px 14px", fontSize: 13 }}>
              Account
            </Link>
          )}
          {isMobile && (
            <button className="hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
              <span style={{ transform: menuOpen ? "rotate(45deg) translate(5px, 5px)" : "none" }} />
              <span style={{ opacity: menuOpen ? 0 : 1 }} />
              <span style={{ transform: menuOpen ? "rotate(-45deg) translate(5px, -5px)" : "none" }} />
            </button>
          )}
        </div>
      </nav>

      {isMobile && menuOpen && (
        <div className="mobile-menu">
          {links.map(l => (
            <Link key={l.href} href={l.href} style={{ color: isActive(l.href) ? "var(--green)" : "var(--text)" }}>
              {l.label}
            </Link>
          ))}
          {isAdmin && <Link href="/admin" style={{ color: "var(--gold)" }}>Admin</Link>}
          <Link href="/account">Account</Link>
          <div style={{ borderTop: "1px solid var(--border)", marginTop: 8, paddingTop: 10, paddingLeft: 14, fontSize: 12, color: "var(--muted)" }}>
            18+ · <a href="https://www.begambleaware.org" target="_blank" rel="noopener noreferrer" style={{ color: "var(--muted)" }}>BeGambleAware.org</a>
          </div>
        </div>
      )}

      <div className="ticker-wrap">
        {tickerItems.length > 0 ? (
          <div className="ticker-track" title="Hover to pause">
            {[...tickerItems, ...tickerItems].map((item, i) => (
              <span key={i} className="ticker-item">
                <span className="ticker-label">{item.persona}</span>
                <span style={{ color: "var(--text)", fontWeight: 600 }}>{item.horse}</span>
                <span style={{ color: "var(--muted)", fontSize: 11 }}>{item.course}</span>
                <span className={item.cls}>{item.result}</span>
              </span>
            ))}
          </div>
        ) : (
          <div className="ticker-empty">
            Results ticker · Tips updated daily from 07:00 · Settle from 15:00
          </div>
        )}
      </div>
    </>
  );
}