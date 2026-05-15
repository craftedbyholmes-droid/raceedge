'use client';
import React, { useState, useEffect } from 'react';
import { usePlan } from '../../lib/usePlan.js';
import { useOdds } from '../../components/OddsToggle.jsx';

export default function TomorrowPage() {
  const { plan, loading: planLoading } = usePlan();
  const { showDecimal } = useOdds();
  const [races, setRaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  useEffect(function() {
    fetch('/api/tomorrow')
      .then(function(r) { return r.json(); })
      .then(function(data) { setRaces(data.races || []); setLoading(false); })
      .catch(function() { setLoading(false); });
  }, []);

  if (!planLoading && plan === 'free') {
    return React.createElement('div', { className: 'page' },
      React.createElement('h1', { style: { fontSize: '26px', marginBottom: '16px' } }, 'Tomorrow\u0027s Races'),
      React.createElement('div', { className: 'upgrade-box' },
        React.createElement('h3', null, 'Pro or Edge required'),
        React.createElement('p', null, 'Get early access to tomorrow\u0027s races.'),
        React.createElement('a', { href: '/pricing', className: 'btn btn-green' }, 'Upgrade')
      )
    );
  }

  function toggleRace(raceId) {
    setExpanded(function(prev) { var next = Object.assign({}, prev); next[raceId] = !next[raceId]; return next; });
  }

  function getOdds(runner) {
    return showDecimal ? (runner.best_dec ? runner.best_dec.toFixed(2) : 'N/A') : (runner.best_frac || 'N/A');
  }

  return React.createElement('div', { className: 'page' },
    React.createElement('h1', { style: { fontSize: '26px', marginBottom: '20px' } }, 'Tomorrow\u0027s Races'),
    loading ? React.createElement('p', { style: { color: '#666' } }, 'Loading...')
    : races.length === 0 ? React.createElement('p', { style: { color: '#666' } }, 'No races available yet for tomorrow.')
    : races.map(function(race) {
      var isOpen = expanded[race.race_id];
      var runners = race.runners || [];
      return React.createElement('div', { key: race.race_id, className: 'card' },
        React.createElement('div', { onClick: function() { toggleRace(race.race_id); }, style: { display: 'flex', justifyContent: 'space-between', cursor: 'pointer' } },
          React.createElement('div', null,
            React.createElement('span', { style: { fontWeight: '600' } }, race.course),
            React.createElement('span', { style: { color: '#666', fontSize: '13px', marginLeft: '10px' } }, race.off_time),
            React.createElement('span', { style: { color: '#555', fontSize: '12px', marginLeft: '8px' } }, race.going || '')
          ),
          React.createElement('span', { style: { color: '#666', fontSize: '18px' } }, isOpen ? '-' : '+')
        ),
        isOpen && React.createElement('div', { style: { marginTop: '12px', borderTop: '1px solid #1e1e35', paddingTop: '12px' } },
          runners.map(function(runner, ri) {
            return React.createElement('div', { key: ri, style: { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: ri < runners.length - 1 ? '1px solid #1a1a2e' : 'none', flexWrap: 'wrap', gap: '6px' } },
              React.createElement('div', null,
                React.createElement('span', { style: { fontWeight: '600' } }, runner.horse_name),
                React.createElement('span', { style: { color: '#666', fontSize: '12px', marginLeft: '8px' } }, runner.jockey || '')
              ),
              React.createElement('div', { style: { display: 'flex', gap: '8px', alignItems: 'center' } },
                React.createElement('span', { style: { color: '#a3e635', fontWeight: '700' } }, getOdds(runner)),
                React.createElement('span', { style: { background: '#1a1a2e', color: '#888', borderRadius: '4px', padding: '3px 8px', fontSize: '12px' } }, runner.total + '/100')
              )
            );
          })
        )
      );
    })
  );
}
