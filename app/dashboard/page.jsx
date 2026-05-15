'use client';
import React, { useState, useEffect } from 'react';
import { usePlan } from '../../lib/usePlan.js';
import { useOdds } from '../../components/OddsToggle.jsx';
import { affiliateUrl } from '../../lib/odds.js';

export default function DashboardPage() {
  const { plan, loading: planLoading } = usePlan();
  const { showDecimal } = useOdds();
  const [races, setRaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});
  const [topPicksPage, setTopPicksPage] = useState(0);
  const PICKS_PER_PAGE = 10;

  function loadRaces() {
    setLoading(true);
    fetch('/api/races')
      .then(function(r) { return r.json(); })
      .then(function(data) { setRaces(data.races || []); setLoading(false); })
      .catch(function() { setLoading(false); });
  }

  useEffect(function() { loadRaces(); }, []);

  function toggleRace(raceId) {
    setExpanded(function(prev) { var next = Object.assign({}, prev); next[raceId] = !next[raceId]; return next; });
  }

  function getOdds(runner) {
    if (!runner) return 'N/A';
    return showDecimal ? (runner.best_dec ? runner.best_dec.toFixed(2) : 'N/A') : (runner.best_frac || 'N/A');
  }

  var today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  var totalRaces = races.length;
  var topPicks = races.reduce(function(acc, r) {
    return acc.concat((r.runners || []).filter(function(run) { return run.total >= 70; }).map(function(run) {
      return Object.assign({}, run, { course: r.course, off_time: r.off_time, race_type: r.race_type });
    }));
  }, []).sort(function(a, b) { return b.total - a.total; });
  var strongPicks = races.reduce(function(acc, r) {
    return acc + (r.runners || []).filter(function(run) { return run.total >= 75; }).length;
  }, 0);
  var confidence = totalRaces > 0 ? Math.round((strongPicks / Math.max(totalRaces, 1)) * 100) : 0;
  var planBadgeColor = { free: '#888', pro: '#4d9fff', edge: '#a3e635' };
  var visibleTopPicks = plan === 'free' ? topPicks.slice(0, 1) : topPicks.slice(topPicksPage * PICKS_PER_PAGE, (topPicksPage + 1) * PICKS_PER_PAGE);

  return React.createElement('div', { className: 'page' },
    React.createElement('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '8px' } },
      React.createElement('div', null,
        React.createElement('h1', { style: { fontSize: '26px', fontWeight: '700' } }, 'Today\u0027s Races'),
        React.createElement('p', { style: { color: '#666', fontSize: '13px', marginTop: '2px' } }, today)
      ),
      React.createElement('div', { style: { display: 'flex', gap: '8px', alignItems: 'center' } },
        React.createElement('span', { style: { color: planBadgeColor[plan] || '#888', fontSize: '11px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', border: '1px solid', borderColor: planBadgeColor[plan] || '#888', borderRadius: '4px', padding: '2px 8px' } }, plan),
        plan === 'edge' && React.createElement('button', { onClick: loadRaces, style: { background: '#1a3a0a', border: '1px solid #a3e635', color: '#a3e635', borderRadius: '4px', padding: '4px 12px', fontSize: '12px', cursor: 'pointer' } }, 'Refresh')
      )
    ),
    React.createElement('div', { className: 'stats-bar' },
      React.createElement('div', { className: 'stat-box' }, React.createElement('div', { className: 'val' }, totalRaces), React.createElement('div', { className: 'lbl' }, 'Races Today')),
      React.createElement('div', { className: 'stat-box' }, React.createElement('div', { className: 'val' }, strongPicks), React.createElement('div', { className: 'lbl' }, 'Strong Picks (75+)')),
      React.createElement('div', { className: 'stat-box' }, React.createElement('div', { className: 'val' }, topPicks.length), React.createElement('div', { className: 'lbl' }, 'Top Picks (70+)')),
      React.createElement('div', { className: 'stat-box' }, React.createElement('div', { className: 'val' }, confidence + '%'), React.createElement('div', { className: 'lbl' }, 'Confidence'))
    ),
    topPicks.length > 0 && React.createElement('div', { style: { marginBottom: '24px' } },
      React.createElement('h2', { style: { fontSize: '16px', marginBottom: '12px', color: '#a3e635' } }, 'Top Picks'),
      visibleTopPicks.map(function(runner, i) {
        var aff = affiliateUrl('bet365');
        return React.createElement('div', { key: i, className: 'card', style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' } },
          React.createElement('div', null,
            runner.total >= 75 && React.createElement('div', { style: { fontSize: '10px', color: '#a3e635', fontWeight: '700', marginBottom: '4px' } }, 'HIGH CONFIDENCE'),
            React.createElement('div', { style: { fontWeight: '600', fontSize: '15px' } }, runner.horse_name),
            React.createElement('div', { style: { color: '#888', fontSize: '12px', marginTop: '2px' } }, runner.course + ' ' + (runner.off_time || '') + ' - ' + (runner.race_type || ''))
          ),
          React.createElement('div', { style: { display: 'flex', gap: '8px', alignItems: 'center' } },
            React.createElement('span', { style: { color: '#a3e635', fontWeight: '700', fontSize: '16px' } }, getOdds(runner)),
            aff && React.createElement('a', { href: aff, target: '_blank', rel: 'noopener noreferrer', style: { background: '#1a2a0a', border: '1px solid #a3e635', color: '#a3e635', borderRadius: '4px', padding: '4px 10px', fontSize: '12px' } }, 'Bet365'),
            React.createElement('span', { style: { background: '#1a1a2e', color: '#888', borderRadius: '4px', padding: '4px 8px', fontSize: '12px' } }, runner.total + '/100')
          )
        );
      }),
      plan === 'free' && topPicks.length > 1 && React.createElement('div', { className: 'upgrade-box' },
        React.createElement('h3', null, topPicks.length - 1 + ' more picks available'),
        React.createElement('p', null, 'Upgrade to Pro to see all top picks.'),
        React.createElement('a', { href: '/pricing', className: 'btn btn-green' }, 'Upgrade to Pro')
      ),
      plan !== 'free' && topPicks.length > PICKS_PER_PAGE && React.createElement('div', { style: { display: 'flex', gap: '8px', marginTop: '12px' } },
        React.createElement('button', { onClick: function() { setTopPicksPage(function(p) { return Math.max(0, p - 1); }); }, disabled: topPicksPage === 0, style: { background: 'none', border: '1px solid #444', color: '#ccc', borderRadius: '4px', padding: '6px 14px', fontSize: '13px', cursor: 'pointer' } }, 'Prev'),
        React.createElement('button', { onClick: function() { setTopPicksPage(function(p) { return p + 1; }); }, disabled: (topPicksPage + 1) * PICKS_PER_PAGE >= topPicks.length, style: { background: 'none', border: '1px solid #444', color: '#ccc', borderRadius: '4px', padding: '6px 14px', fontSize: '13px', cursor: 'pointer' } }, 'Next')
      )
    ),
    loading ? React.createElement('p', { style: { color: '#666' } }, 'Loading races...')
    : races.length === 0 ? React.createElement('p', { style: { color: '#666' } }, 'No races available yet. Check back after 08:00.')
    : races.map(function(race) {
      var isOpen = expanded[race.race_id];
      var runners = race.runners || [];
      return React.createElement('div', { key: race.race_id, className: 'card', style: { marginBottom: '8px' } },
        React.createElement('div', { onClick: function() { toggleRace(race.race_id); }, style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' } },
          React.createElement('div', null,
            React.createElement('span', { style: { fontWeight: '600', fontSize: '15px' } }, race.course),
            React.createElement('span', { style: { color: '#666', fontSize: '13px', marginLeft: '10px' } }, race.off_time),
            React.createElement('span', { style: { color: '#555', fontSize: '12px', marginLeft: '8px' } }, race.going || ''),
            runners.length === 2 && React.createElement('span', { style: { marginLeft: '8px', background: '#1a1a2e', color: '#888', fontSize: '10px', fontWeight: '700', padding: '1px 6px', borderRadius: '3px' } }, 'RF')
          ),
          React.createElement('span', { style: { color: '#666', fontSize: '18px' } }, isOpen ? '-' : '+')
        ),
        isOpen && React.createElement('div', { style: { marginTop: '12px', borderTop: '1px solid #1e1e35', paddingTop: '12px' } },
          runners.map(function(runner, ri) {
            return React.createElement('div', { key: ri, style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: ri < runners.length - 1 ? '1px solid #1a1a2e' : 'none', flexWrap: 'wrap', gap: '6px' } },
              React.createElement('div', null,
                runner.total >= 75 && React.createElement('span', { style: { fontSize: '10px', color: '#a3e635', fontWeight: '700', marginRight: '6px' } }, 'HIGH CONF'),
                React.createElement('span', { style: { fontWeight: '600' } }, runner.horse_name),
                React.createElement('span', { style: { color: '#666', fontSize: '12px', marginLeft: '8px' } }, runner.jockey || ''),
                React.createElement('div', { style: { color: '#555', fontSize: '11px', marginTop: '2px' } }, 'Form: ' + (runner.form || '-') + ' | Draw: ' + (runner.draw || '-'))
              ),
              React.createElement('div', { style: { display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' } },
                React.createElement('span', { style: { color: '#a3e635', fontWeight: '700' } }, getOdds(runner)),
                (runner.bookmakers || []).slice(0, 4).map(function(bm, bi) {
                  var url = affiliateUrl(bm.bookmaker);
                  if (!url) return null;
                  return React.createElement('a', { key: bi, href: url, target: '_blank', rel: 'noopener noreferrer', style: { background: '#0f0f1a', border: '1px solid #2a2a3e', color: '#ccc', borderRadius: '3px', padding: '2px 7px', fontSize: '11px' } },
                    bm.bookmaker + ' ' + (showDecimal ? (bm.decimal ? bm.decimal.toFixed(2) : '') : (bm.fractional || ''))
                  );
                }),
                React.createElement('span', { style: { background: '#1a1a2e', color: runner.total >= 75 ? '#a3e635' : runner.total >= 70 ? '#4d9fff' : '#888', borderRadius: '4px', padding: '3px 8px', fontSize: '12px', fontWeight: '600' } }, runner.total + '/100')
              )
            );
          })
        )
      );
    })
  );
}
