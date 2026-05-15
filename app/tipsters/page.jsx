'use client';
import React, { useState, useEffect } from 'react';
import { usePlan } from '../../lib/usePlan.js';

export default function TipstersPage() {
  const { plan, loading: planLoading } = usePlan();
  const [picks, setPicks] = useState({});
  const [stats, setStats] = useState({ season: [], picks: [] });
  const [tab, setTab] = useState('AJ');
  const [loading, setLoading] = useState(true);

  useEffect(function() {
    Promise.all([
      fetch('/api/personas/picks').then(function(r) { return r.json(); }),
      fetch('/api/stats').then(function(r) { return r.json(); }),
    ]).then(function(results) {
      setPicks(results[0].picks || {});
      setStats(results[1]);
      setLoading(false);
    }).catch(function() { setLoading(false); });
  }, []);

  var personaConfig = {
    AJ: { name: 'Rambling Robbie', colour: '#a3e635', spec: 'Jumps (Chase + Hurdle)', bio: 'Old school jumps man. Trusts the mud and does not mind a grey sky.' },
    TC: { name: 'Punter Pat', colour: '#4d9fff', spec: 'Flat only', bio: 'Flat specialist. Obsessed with draw bias and firm ground.' },
  };

  function getSeason(id) { return (stats.season || []).find(function(s) { return s.persona === id; }) || {}; }
  function formatPnL(s) { var r = (s.total_returned || 0) - (s.total_staked || 0); return (r >= 0 ? '+' : '') + String.fromCharCode(163) + Math.abs(r).toFixed(2); }
  function pnlColor(s) { return ((s.total_returned || 0) - (s.total_staked || 0)) >= 0 ? '#a3e635' : '#ff6b6b'; }
  function strikeRate(s) { return s.total_picks ? Math.round((s.winners / s.total_picks) * 100) + '%' : '0%'; }

  function getBadge(pick) {
    if (pick.is_nr) return React.createElement('span', { className: 'badge badge-amber' }, 'N/R');
    if (pick.position === null) return React.createElement('span', { className: 'badge badge-grey' }, 'Pending');
    if (pick.position === 1) return React.createElement('span', { className: 'badge badge-green' }, 'WON');
    if (pick.position <= 3) return React.createElement('span', { className: 'badge badge-blue' }, pick.position + (pick.position === 2 ? 'nd' : 'rd'));
    return React.createElement('span', { className: 'badge badge-red' }, pick.position + 'th');
  }

  function groupByDate(personaId) {
    var grouped = {};
    for (var p of (stats.picks || []).filter(function(p) { return p.persona === personaId; })) {
      if (!grouped[p.race_date]) grouped[p.race_date] = [];
      grouped[p.race_date].push(p);
    }
    return grouped;
  }

  return React.createElement('div', { className: 'page' },
    React.createElement('h1', { style: { fontSize: '26px', marginBottom: '20px' } }, 'Tipsters'),
    React.createElement('div', { style: { display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' } },
      ['AJ', 'TC'].map(function(id) {
        var cfg = personaConfig[id]; var s = getSeason(id);
        return React.createElement('div', { key: id, className: 'card', style: { flex: '1', minWidth: '220px', borderColor: cfg.colour } },
          React.createElement('div', { style: { color: cfg.colour, fontWeight: '700', marginBottom: '4px' } }, cfg.name),
          React.createElement('div', { style: { color: '#888', fontSize: '12px', marginBottom: '8px' } }, cfg.spec),
          React.createElement('p', { style: { color: '#666', fontSize: '13px', marginBottom: '12px', fontStyle: 'italic' } }, cfg.bio),
          React.createElement('div', { style: { display: 'flex', gap: '16px', flexWrap: 'wrap' } },
            React.createElement('div', null, React.createElement('div', { style: { color: pnlColor(s), fontWeight: '700', fontSize: '20px' } }, formatPnL(s)), React.createElement('div', { style: { color: '#666', fontSize: '11px' } }, 'P&L')),
            React.createElement('div', null, React.createElement('div', { style: { fontWeight: '700', fontSize: '20px' } }, s.total_picks || 0), React.createElement('div', { style: { color: '#666', fontSize: '11px' } }, 'Picks')),
            React.createElement('div', null, React.createElement('div', { style: { fontWeight: '700', fontSize: '20px' } }, s.winners || 0), React.createElement('div', { style: { color: '#666', fontSize: '11px' } }, 'Won')),
            React.createElement('div', null, React.createElement('div', { style: { fontWeight: '700', fontSize: '20px' } }, strikeRate(s)), React.createElement('div', { style: { color: '#666', fontSize: '11px' } }, 'Strike'))
          )
        );
      })
    ),
    !planLoading && plan === 'free'
      ? React.createElement('div', { className: 'upgrade-box' },
          React.createElement('h3', null, 'Today\u0027s picks'),
          React.createElement('p', null, 'Upgrade to Pro to see today\u0027s selections.'),
          React.createElement('a', { href: '/pricing', className: 'btn btn-green' }, 'Upgrade to Pro')
        )
      : React.createElement('div', { style: { marginBottom: '24px' } },
          React.createElement('h2', { style: { fontSize: '16px', marginBottom: '12px' } }, 'Today\u0027s Picks'),
          loading ? React.createElement('p', { style: { color: '#666' } }, 'Loading...')
          : ['AJ', 'TC'].map(function(id) {
              var cfg = personaConfig[id];
              var todayPicks = picks[id] || [];
              return React.createElement('div', { key: id, style: { marginBottom: '16px' } },
                React.createElement('div', { style: { color: cfg.colour, fontWeight: '600', fontSize: '13px', marginBottom: '8px' } }, cfg.name),
                todayPicks.length === 0
                  ? React.createElement('p', { style: { color: '#555', fontSize: '13px' } }, 'No picks today.')
                  : todayPicks.map(function(pick, i) {
                      return React.createElement('div', { key: i, className: 'card', style: { borderColor: pick.is_best_pick ? cfg.colour : '#1e1e35' } },
                        React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' } },
                          React.createElement('div', null,
                            pick.is_best_pick && React.createElement('span', { className: 'best-pick-badge', style: { background: cfg.colour, marginBottom: '6px', display: 'inline-block' } }, 'BEST PICK'),
                            React.createElement('div', { style: { fontWeight: '700', fontSize: '16px' } }, pick.horse_name),
                            React.createElement('div', { style: { color: '#888', fontSize: '12px', marginTop: '2px' } }, pick.course + ' - ' + pick.race_type),
                            pick.tip_text && React.createElement('p', { style: { color: '#aaa', fontSize: '13px', marginTop: '8px', fontStyle: 'italic' } }, pick.tip_text)
                          ),
                          React.createElement('div', { style: { textAlign: 'right' } },
                            React.createElement('div', { style: { color: '#a3e635', fontWeight: '700', fontSize: '16px' } }, pick.odds || 'N/A'),
                            React.createElement('div', { style: { color: '#666', fontSize: '11px', marginTop: '2px' } }, 'Score: ' + pick.score + '/100')
                          )
                        )
                      );
                    })
              );
            })
        ),
    plan !== 'free' && React.createElement('div', null,
      React.createElement('h2', { style: { fontSize: '16px', marginBottom: '12px' } }, 'History'),
      React.createElement('div', { className: 'tab-bar' },
        ['AJ', 'TC'].map(function(id) {
          return React.createElement('button', { key: id, className: 'tab' + (tab === id ? ' active' : ''), onClick: function() { setTab(id); } }, personaConfig[id].name);
        })
      ),
      Object.entries(groupByDate(tab)).sort(function(a, b) { return b[0].localeCompare(a[0]); }).map(function(entry) {
        var date = entry[0]; var datePicks = entry[1];
        return React.createElement('div', { key: date, style: { marginBottom: '16px' } },
          React.createElement('div', { style: { color: '#666', fontSize: '12px', marginBottom: '8px' } }, date),
          datePicks.map(function(pick, i) {
            return React.createElement('div', { key: i, className: 'card', style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' } },
              React.createElement('div', null,
                pick.is_best_pick && React.createElement('span', { className: 'best-pick-badge', style: { background: personaConfig[tab].colour, marginRight: '8px' } }, 'BEST'),
                React.createElement('span', { style: { fontWeight: '600' } }, pick.horse_name),
                React.createElement('span', { style: { color: '#666', fontSize: '12px', marginLeft: '8px' } }, pick.course)
              ),
              React.createElement('div', { style: { display: 'flex', gap: '8px', alignItems: 'center' } },
                getBadge(pick),
                pick.profit !== null && React.createElement('span', { style: { color: pick.profit >= 0 ? '#a3e635' : '#ff6b6b', fontSize: '13px', fontWeight: '600' } }, (pick.profit >= 0 ? '+' : '') + String.fromCharCode(163) + Math.abs(pick.profit || 0).toFixed(2))
              )
            );
          })
        );
      })
    )
  );
}
