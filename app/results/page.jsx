'use client';
import { useState, useEffect } from 'react';
import { usePlan } from '@/lib/usePlan';

function PosBadge({ position, isNR }) {
  if (isNR)           return <span className="pos-nr">N/R</span>;
  if (!position)      return <span className="pos-pending">Pending</span>;
  if (position === 1) return <span className="pos-win">WON</span>;
  if (position <= 3)  return <span className="pos-place">{position}{['','st','nd','rd'][position]||'th'}</span>;
  return <span className="pos-unplace">{position}th</span>;
}

function PNL({ val }) {
  const v = parseFloat(val) || 0;
  return (
    <span style={{ color: v >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 700 }}>
      {v >= 0 ? '+' : ''}£{Math.abs(v).toFixed(2)}
    </span>
  );
}

function pickPnL(p) {
  if (p.is_nr || !p.position) return null;
  const sp    = parseFloat(p.sp_decimal) || 0;
  const terms = (p.field_size || 0) >= 8 ? 3 : 2;
  let ret = 0;
  if (p.position === 1)          { ret = 5 * sp + 5 * (sp - 1) / 4 + 5; }
  else if (p.position <= terms)  { ret = 5 * (sp - 1) / 4 + 5; }
  return Math.round((ret - 10) * 100) / 100;
}

function fmtDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long'
  });
}

export default function ResultsPage() {
  const [data, setData]       = useState(null);
  const [view, setView]       = useState('day');    // 'day' | 'track'
  const [open, setOpen]       = useState({});
  const [filterPersona, setFilterPersona] = useState('all');
  const { plan } = usePlan();

  useEffect(() => {
    fetch('/api/selections')
      .then(r => r.json())
      .then(setData);
  }, []);

  if (!data) return (
    <div style={{ color: 'var(--muted)', textAlign: 'center', padding: 40 }}>
      Loading results...
    </div>
  );

  const today = new Date().toISOString().split('T')[0];
  let all = (data.selections || []).filter(s => s.race_date < today);

  if (filterPersona !== 'all') {
    all = all.filter(s => s.persona === filterPersona);
  }

  const personaName = { AJ: 'Rambling Robbie', TC: 'Punter Pat' };

  // Stats
  const settled  = all.filter(s => s.position !== null && !s.is_nr);
  const winners  = settled.filter(s => s.position === 1).length;
  const placed   = settled.filter(s => s.position > 1 && s.position <= ((s.field_size || 0) >= 8 ? 3 : 2)).length;
  const totalPnL = all.reduce((acc, p) => { const v = pickPnL(p); return v !== null ? acc + v : acc; }, 0);
  const placeRate = settled.length > 0 ? Math.round((winners + placed) / settled.length * 100) : 0;

  const toggle = key => setOpen(o => Object.assign({}, o, { [key]: !o[key] }));

  // Group by day
  const byDay = {};
  for (const s of all) {
    const key = s.race_date;
    if (!byDay[key]) byDay[key] = [];
    byDay[key].push(s);
  }
  const dayGroups = Object.entries(byDay).sort((a, b) => b[0].localeCompare(a[0]));

  // Group by track
  const byTrack = {};
  for (const s of all) {
    const key = s.course || 'Unknown';
    if (!byTrack[key]) byTrack[key] = [];
    byTrack[key].push(s);
  }
  const trackGroups = Object.entries(byTrack).sort((a, b) => a[0].localeCompare(b[0]));

  function GroupSummary({ picks }) {
    const w = picks.filter(p => p.position === 1).length;
    const pl = picks.reduce((acc, p) => { const v = pickPnL(p); return v !== null ? acc + v : acc; }, 0);
    const pending = picks.filter(p => !p.position && !p.is_nr).length;
    return (
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', fontSize: 12, color: 'var(--muted)', flexShrink: 0 }}>
        {pending > 0 && <span style={{ color: 'var(--muted)' }}>{pending} pending</span>}
        <span>{picks.length} picks</span>
        {w > 0 && <span style={{ color: 'var(--green)', fontWeight: 700 }}>{w} won</span>}
        <PNL val={pl} />
      </div>
    );
  }

  function PickRow({ p }) {
    const pv = pickPnL(p);
    return (
      <div style={{
        display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8,
        padding: '10px 0', borderBottom: '1px solid var(--border)'
      }}>
        <div style={{ flex: 1, minWidth: 160 }}>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 15 }}>
            {p.horse_name}
            {p.is_best_pick && (
              <span style={{ marginLeft: 8, background: 'var(--gold)', color: '#000',
                fontSize: 10, fontWeight: 800, padding: '1px 6px', borderRadius: 3,
                letterSpacing: '0.5px', textTransform: 'uppercase' }}>Best Pick</span>
            )}
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
            {view === 'day' ? p.course : fmtDate(p.race_date)}
            {' · '}{p.race_type}
            {' · '}<span style={{ color: 'var(--muted)' }}>{personaName[p.persona] || p.persona}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 14, color: 'var(--gold)', fontWeight: 700, minWidth: 40 }}>
            {p.odds || 'N/A'}
          </span>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>
            {p.sp_decimal ? parseFloat(p.sp_decimal).toFixed(2) + ' SP' : ''}
          </span>
          <PosBadge position={p.position} isNR={p.is_nr} />
          {pv !== null && <PNL val={pv} />}
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: 16 }}>
      <h1 className="section-title">Results</h1>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-box">
          <div className="stat-val">{all.length}</div>
          <div className="stat-lbl">Picks</div>
        </div>
        <div className="stat-box">
          <div className="stat-val" style={{ color: 'var(--green)' }}>{winners}</div>
          <div className="stat-lbl">Winners</div>
        </div>
        <div className="stat-box">
          <div className="stat-val" style={{ color: 'var(--blue)' }}>{placed}</div>
          <div className="stat-lbl">Placed</div>
        </div>
        <div className="stat-box">
          <div className="stat-val">{placeRate}%</div>
          <div className="stat-lbl">Place Rate</div>
        </div>
        <div className="stat-box" style={{ minWidth: 90 }}>
          <div className="stat-val" style={{ fontSize: 18, color: totalPnL >= 0 ? 'var(--green)' : 'var(--red)' }}>
            {totalPnL >= 0 ? '+' : ''}£{Math.abs(totalPnL).toFixed(2)}
          </div>
          <div className="stat-lbl">P&amp;L</div>
        </div>
      </div>

      {/* Persona filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {['all', 'AJ', 'TC'].map(p => (
          <button key={p} onClick={() => setFilterPersona(p)}
            className={'btn ' + (filterPersona === p ? (p === 'AJ' ? 'btn-green' : p === 'TC' ? 'btn-blue' : 'btn-ghost') : 'btn-ghost')}
            style={{ fontSize: 13, padding: '6px 14px' }}>
            {p === 'all' ? 'All Tipsters' : p === 'AJ' ? 'Robbie' : 'Pat'}
          </button>
        ))}
      </div>

      {/* View toggle */}
      <div className="tabs">
        <div className={'tab' + (view === 'day'   ? ' active' : '')} onClick={() => setView('day')}>
          By Day
        </div>
        <div className={'tab' + (view === 'track' ? ' active' : '')} onClick={() => setView('track')}>
          By Track
        </div>
      </div>

      {/* No results */}
      {all.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: 32, color: 'var(--muted)' }}>
          No settled results yet.
        </div>
      )}

      {/* Day view */}
      {view === 'day' && dayGroups.map(([date, picks]) => (
        <div key={date} style={{ marginBottom: 8 }}>
          <div className="month-header" onClick={() => toggle(date)}>
            <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 17 }}>
              {fmtDate(date)}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <GroupSummary picks={picks} />
              <span style={{ color: 'var(--muted)', fontSize: 14 }}>{open[date] ? '▲' : '▼'}</span>
            </span>
          </div>
          {open[date] && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', padding: '0 14px', marginBottom: 4 }}>
              {picks.map((p, i) => <PickRow key={i} p={p} />)}
            </div>
          )}
        </div>
      ))}

      {/* Track view */}
      {view === 'track' && trackGroups.map(([track, picks]) => (
        <div key={track} style={{ marginBottom: 8 }}>
          <div className="month-header" onClick={() => toggle('t_' + track)}>
            <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 17 }}>{track}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <GroupSummary picks={picks} />
              <span style={{ color: 'var(--muted)', fontSize: 14 }}>{open['t_' + track] ? '▲' : '▼'}</span>
            </span>
          </div>
          {open['t_' + track] && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', padding: '0 14px', marginBottom: 4 }}>
              {picks.sort((a, b) => b.race_date.localeCompare(a.race_date)).map((p, i) => (
                <PickRow key={i} p={p} />
              ))}
            </div>
          )}
        </div>
      ))}

      {plan === 'free' && (
        <div className="card" style={{ textAlign: 'center', padding: 24, marginTop: 8 }}>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>
            Showing last 14 days. Upgrade for full history.
          </div>
          <a href="/pricing" className="btn btn-blue">Upgrade to Pro</a>
        </div>
      )}
    </div>
  );
}