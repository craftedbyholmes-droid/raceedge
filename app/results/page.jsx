'use client';
import { useState, useEffect } from 'react';
import { usePlan } from '@/lib/usePlan';

function PosBadge({ position, isNR }) {
  if (isNR)           return <span className="pos-nr">N/R</span>;
  if (!position)      return <span className="pos-pending">Pending</span>;
  if (position === 1) return <span className="pos-win">WON</span>;
  if (position <= 3)  return <span className="pos-place">{position}{['','st','nd','rd'][position] || 'th'}</span>;
  return <span className="pos-unplace">{position}th</span>;
}

export default function ResultsPage() {
  const [data, setData]     = useState(null);
  const [months, setMonths] = useState({});
  const { plan } = usePlan();

  useEffect(() => {
    fetch('/api/selections').then(r => r.json()).then(setData);
  }, []);

  if (!data) return <div style={{ color: 'var(--muted)', textAlign: 'center', padding: 40 }}>Loading results...</div>;

  const today = new Date().toISOString().split('T')[0];
  const all   = (data.selections || []).filter(s => s.race_date < today);
  const shown = plan === 'free' ? all.slice(0, 14) : all;

  const winners = shown.filter(s => s.position === 1).length;
  const placed  = shown.filter(s => s.position > 1 && s.position <= (s.field_size >= 8 ? 3 : 2)).length;
  const accuracy = shown.length > 0 ? Math.round((winners + placed) / shown.length * 100) : 0;

  const byMonth = {};
  for (const s of shown) {
    const m = (s.race_date || '').slice(0, 7);
    if (!byMonth[m]) byMonth[m] = {};
    if (!byMonth[m][s.race_date]) byMonth[m][s.race_date] = [];
    byMonth[m][s.race_date].push(s);
  }

  const fmtMonth = key => {
    const parts = key.split('-');
    return new Date(Number(parts[0]), Number(parts[1]) - 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  };

  return (
    <div style={{ paddingTop: 16 }}>
      <h1 className="section-title">Results</h1>
      <div className="stats-row">
        <div className="stat-box"><div className="stat-val">{shown.length}</div><div className="stat-lbl">Selections</div></div>
        <div className="stat-box"><div className="stat-val" style={{ color: 'var(--green)' }}>{winners}</div><div className="stat-lbl">Winners</div></div>
        <div className="stat-box"><div className="stat-val" style={{ color: 'var(--blue)' }}>{placed}</div><div className="stat-lbl">Placed</div></div>
        <div className="stat-box"><div className="stat-val">{accuracy}%</div><div className="stat-lbl">Place Rate</div></div>
      </div>

      {Object.entries(byMonth).sort((a, b) => b[0].localeCompare(a[0])).map(([month, days]) => (
        <div key={month} style={{ marginBottom: 8 }}>
          <div className="month-header"
            onClick={() => setMonths(m => Object.assign({}, m, { [month]: !m[month] }))}>
            <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 17 }}>{fmtMonth(month)}</span>
            <span style={{ color: 'var(--muted)', fontSize: 14 }}>{months[month] ? '▲' : '▼'}</span>
          </div>
          {months[month] && Object.entries(days).sort((a, b) => b[0].localeCompare(a[0])).map(([day, dayPicks]) => (
            <div key={day} style={{ marginBottom: 8, paddingLeft: 8 }}>
              <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', padding: '6px 0', borderBottom: '1px solid var(--border)', marginBottom: 6 }}>
                {new Date(day).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
              </div>
              {dayPicks.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ flex: 1, minWidth: 140 }}>
                    <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700 }}>{s.horse_name}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{s.course} · {s.race_type}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: 'var(--gold)', fontWeight: 700 }}>{s.odds || 'N/A'}</span>
                    <PosBadge position={s.position} isNR={s.is_nr} />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}

      {plan === 'free' && (
        <div className="card" style={{ textAlign: 'center', padding: 24, marginTop: 8 }}>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>Showing last 14 days. Upgrade for full history.</div>
          <a href="/pricing" className="btn btn-blue">Upgrade to Pro</a>
        </div>
      )}
    </div>
  );
}