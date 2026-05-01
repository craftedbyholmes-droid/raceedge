'use client';
import { useState, useEffect } from 'react';
import { usePlan } from '@/lib/usePlan';

function PNL({ val }) {
  const colour = val >= 0 ? 'var(--green)' : 'var(--red)';
  const sign   = val >= 0 ? '+' : '';
  return <span style={{ color: colour, fontWeight: 700 }}>{sign}£{Math.abs(val).toFixed(2)}</span>;
}

function PosBadge({ position, isNR }) {
  if (isNR)           return <span className="pos-nr">N/R</span>;
  if (!position)      return <span className="pos-pending">Pending</span>;
  if (position === 1) return <span className="pos-win">WON</span>;
  if (position <= 3)  return <span className="pos-place">Placed {position}{['','st','nd','rd'][position] || 'th'}</span>;
  return <span className="pos-unplace">Unplaced</span>;
}

function monthPnL(picks) {
  let staked = 0, returned = 0;
  for (const p of picks) {
    if (p.is_nr) continue;
    staked += 10;
    const sp = parseFloat(p.sp_decimal) || 0;
    const terms = p.field_size >= 8 ? 3 : 2;
    if (p.position === 1) {
      returned += 5 * sp + 5 * (sp - 1) / 4 + 5;
    } else if (p.position && p.position <= terms) {
      returned += 5 * (sp - 1) / 4 + 5;
    }
  }
  return returned - staked;
}

export default function TipstersPage() {
  const [data, setData]     = useState(null);
  const [tab, setTab]       = useState('AJ');
  const [months, setMonths] = useState({});
  const { plan } = usePlan();

  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(setData);
  }, []);

  if (!data) return <div style={{ color: 'var(--muted)', textAlign: 'center', padding: 40 }}>Loading tipsters...</div>;

  const personas = {
    AJ: { name: 'Rambling Robbie', cls: 'robbie', colour: 'var(--robbie)', spec: 'National Hunt - Chase and Hurdle',
          bio: "Jumps specialist with 30 years trackside at Cheltenham. Knows every trainer's prep routine." },
    TC: { name: 'Punter Pat',      cls: 'pat',    colour: 'var(--pat)',    spec: 'Flat Racing Specialist',
          bio: 'Grew up near Newmarket. Stats-driven flat expert with an eye for horses moving through the weights.' },
  };

  const season = data.season || {};
  const picks  = data.picks  || {};
  const today  = data.today  || {};

  const pnl = id => {
    const s = season[id] || {};
    return (s.total_returned || 0) - (s.total_staked || 0);
  };

  const byMonth = id => {
    const all = picks[id] || [];
    const grouped = {};
    for (const p of all) {
      const key = (p.race_date || '').slice(0, 7);
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(p);
    }
    return Object.entries(grouped).sort((a, b) => b[0].localeCompare(a[0]));
  };

  const fmtMonth = key => {
    const parts = key.split('-');
    return new Date(Number(parts[0]), Number(parts[1]) - 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  };

  return (
    <div style={{ paddingTop: 16 }}>
      <h1 className="section-title">Tipsters</h1>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13, fontWeight: 700, color: 'var(--muted)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 12 }}>
          Season Record - £5 Each Way
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['AJ','TC'].map(id => {
            const p = personas[id];
            const s = season[id] || {};
            const profit = pnl(id);
            return (
              <div key={id} style={{ flex: 1, minWidth: 140, background: 'var(--surface2)', borderRadius: 'var(--radius)', padding: 14, borderTop: '3px solid ' + p.colour }}>
                <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 18, marginBottom: 8 }}>{p.name}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  <div><div style={{ fontSize: 10, color: 'var(--muted)' }}>PICKS</div><div style={{ fontWeight: 700 }}>{s.total_picks || 0}</div></div>
                  <div><div style={{ fontSize: 10, color: 'var(--muted)' }}>WINNERS</div><div style={{ fontWeight: 700, color: 'var(--green)' }}>{s.winners || 0}</div></div>
                  <div><div style={{ fontSize: 10, color: 'var(--muted)' }}>STAKED</div><div style={{ fontWeight: 700 }}>£{(s.total_staked || 0).toFixed(0)}</div></div>
                  <div><div style={{ fontSize: 10, color: 'var(--muted)' }}>P&amp;L</div><PNL val={profit} /></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <h2 className="section-title" style={{ fontSize: 18 }}>Today's Tips</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {['AJ','TC'].map(id => {
          const p = personas[id];
          const pick = (today[id] || [])[0];
          return (
            <div key={id} className={'tipster-card ' + p.cls} style={{ flex: 1, minWidth: 240 }}>
              <div className={'tipster-header ' + p.cls}>
                <div>
                  <div className="tipster-name" style={{ color: p.colour }}>{p.name}</div>
                  <div className="tipster-spec">{p.spec}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{p.bio}</div>
                </div>
              </div>
              <div className="tipster-body">
                {!pick ? (
                  <div style={{ color: 'var(--muted)', fontSize: 13, textAlign: 'center', padding: 20 }}>
                    No pick yet today - check back after 08:30
                  </div>
                ) : plan === 'free' ? (
                  <div style={{ textAlign: 'center', padding: 16 }}>
                    <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>Today's tip is for Pro members</div>
                    <a href="/pricing" className="btn btn-blue" style={{ fontSize: 13, padding: '8px 20px' }}>Upgrade to Pro</a>
                  </div>
                ) : (
                  <div className="pick-card" style={{ margin: 0 }}>
                    <div className="pick-best-badge">Best Pick</div>
                    <div className="pick-horse">{pick.horse_name}</div>
                    <div className="pick-meta">{pick.course} · {pick.race_type}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
                      <div>
                        <div style={{ fontSize: 10, color: 'var(--muted)' }}>ODDS</div>
                        <div className="pick-odds">{pick.odds || 'N/A'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: 'var(--muted)' }}>SCORE</div>
                        <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 22, color: 'var(--gold)' }}>{Math.round(pick.score || 0)}</div>
                      </div>
                    </div>
                    {pick.tip_text && <div className="pick-tip">"{pick.tip_text}"</div>}
                    <div className="pick-stake">£5 each way - Total stake £10</div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {plan === 'free' ? (
        <div className="card" style={{ textAlign: 'center', padding: 32 }}>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>Full monthly archive available on Pro</div>
          <a href="/pricing" className="btn btn-blue">View Plans</a>
        </div>
      ) : (
        <>
          <h2 className="section-title" style={{ fontSize: 18, marginTop: 8 }}>Pick Archive</h2>
          <div className="tabs">
            <div className={'tab' + (tab === 'AJ' ? ' active' : '')} onClick={() => setTab('AJ')}>Robbie</div>
            <div className={'tab' + (tab === 'TC' ? ' active' : '')} onClick={() => setTab('TC')}>Pat</div>
          </div>
          {byMonth(tab).map(([month, mPicks]) => {
            const profit = monthPnL(mPicks);
            const open   = months[month];
            return (
              <div key={month} style={{ marginBottom: 8 }}>
                <div className="month-header"
                  onClick={() => setMonths(m => Object.assign({}, m, { [month]: !m[month] }))}>
                  <span>
                    {fmtMonth(month)}
                    <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 400 }}> ({mPicks.length} picks)</span>
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <PNL val={profit} />
                    <span style={{ color: 'var(--muted)', fontSize: 14 }}>{open ? '▲' : '▼'}</span>
                  </span>
                </div>
                {open && mPicks.map((p, i) => (
                  <div key={i} style={{
                    background: 'var(--surface2)', borderRadius: 'var(--radius)',
                    padding: '10px 12px', marginBottom: 4,
                    display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center'
                  }}>
                    <div style={{ flex: 1, minWidth: 160 }}>
                      <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 14 }}>{p.horse_name}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>{p.course} · {p.race_date}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13, color: 'var(--gold)', fontWeight: 700 }}>{p.odds || 'N/A'}</span>
                      <PosBadge position={p.position} isNR={p.is_nr} />
                      {!p.is_nr && p.position !== null && <PNL val={monthPnL([p])} />}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}