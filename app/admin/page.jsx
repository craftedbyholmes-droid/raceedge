'use client';
import React, { useState, useEffect } from 'react';
import { createAuthClient } from '../../lib/supabaseAuth.js';

export default function AdminPage() {
  const [user, setUser] = useState(null);
  const [log, setLog] = useState([]);
  const [loading, setLoading] = useState(false);
  const supabase = createAuthClient();
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

  useEffect(function() {
    supabase.auth.getSession().then(function(res) {
      if (res.data.session) setUser(res.data.session.user);
    });
  }, []);

  if (!user || user.email !== adminEmail) {
    return React.createElement('div', { className: 'page' },
      React.createElement('h1', { style: { fontSize: '26px', marginBottom: '16px' } }, 'Admin'),
      React.createElement('p', { style: { color: '#888' } }, !user ? 'Sign in to access the admin panel.' : 'Access restricted.')
    );
  }

  function addLog(label, data) {
    var ts = new Date().toLocaleTimeString();
    var msg = '[' + ts + '] ' + label + ': ' + (data.success ? 'OK' : 'FAILED');
    if (data.errors && data.errors.length > 0) msg += ' | ' + data.errors.join(', ');
    if (data.scored !== undefined) msg += ' | Scored: ' + data.scored;
    if (data.today) msg += ' | ' + data.today.races + ' races, ' + data.today.runners + ' runners';
    setLog(function(prev) { return [msg].concat(prev); });
  }

  async function runStep(path, label) {
    setLoading(true);
    try {
      var res = await fetch(path, { headers: { Authorization: 'Bearer ' + process.env.NEXT_PUBLIC_CRON_SECRET } });
      var data = await res.json();
      addLog(label, data);
    } catch (err) {
      addLog(label, { success: false, errors: [err.message] });
    }
    setLoading(false);
  }

  var btnStyle = { background: '#12121f', border: '1px solid #2a2a3e', color: '#ccc', borderRadius: '6px', padding: '10px 18px', fontSize: '13px', cursor: 'pointer', width: '100%', textAlign: 'left', marginBottom: '6px' };
  var steps = [
    { path: '/api/cron',            label: '1. Fetch Racecards' },
    { path: '/api/cron/score',      label: '2. Score Runners' },
    { path: '/api/cron/cache',      label: '3. Build Cache' },
    { path: '/api/personas',        label: '4. Generate Picks' },
    { path: '/api/results/fetch',   label: '5. Fetch Results (Yesterday)' },
    { path: '/api/personas/settle', label: '6. Settle Picks' },
    { path: '/api/cron/midnight',   label: 'Full Midnight Run' },
  ];

  return React.createElement('div', { className: 'page' },
    React.createElement('h1', { style: { fontSize: '26px', marginBottom: '8px' } }, 'Admin Panel'),
    React.createElement('p', { style: { color: '#666', fontSize: '13px', marginBottom: '24px' } }, 'Signed in as ' + user.email),
    React.createElement('div', { style: { display: 'flex', gap: '20px', flexWrap: 'wrap' } },
      React.createElement('div', { style: { flex: '0 0 260px' } },
        React.createElement('h2', { style: { fontSize: '14px', color: '#888', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' } }, 'Cron Steps'),
        steps.map(function(step) {
          return React.createElement('button', { key: step.path, onClick: function() { runStep(step.path, step.label); }, disabled: loading, style: btnStyle }, loading ? '...' : step.label);
        })
      ),
      React.createElement('div', { style: { flex: '1', minWidth: '280px' } },
        React.createElement('h2', { style: { fontSize: '14px', color: '#888', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' } }, 'Log'),
        React.createElement('div', { style: { background: '#0a0a14', border: '1px solid #1e1e35', borderRadius: '6px', padding: '12px', fontFamily: 'monospace', fontSize: '12px', minHeight: '200px', maxHeight: '400px', overflowY: 'auto' } },
          log.length === 0
            ? React.createElement('span', { style: { color: '#444' } }, 'No activity yet.')
            : log.map(function(line, i) {
                return React.createElement('div', { key: i, style: { color: line.includes('FAILED') ? '#ff6b6b' : '#a3e635', marginBottom: '4px' } }, line);
              })
        )
      )
    )
  );
}
