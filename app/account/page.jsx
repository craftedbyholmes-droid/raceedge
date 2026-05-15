'use client';

import React, { useState, useEffect } from 'react';
import { createAuthClient } from '../../lib/supabaseAuth.js';

export default function AccountPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [user, setUser] = useState(null);
  const [plan, setPlan] = useState('free');
  const supabase = createAuthClient();

  useEffect(function() {
    supabase.auth.getSession().then(function(res) {
      var session = res.data.session;
      if (session) {
        setUser(session.user);
        fetch('/api/user/plan', { headers: { Authorization: 'Bearer ' + session.access_token } })
          .then(function(r) { return r.json(); })
          .then(function(d) { setPlan(d.plan || 'free'); });
      }
    });
  }, []);

  var inputStyle = { width: '100%', padding: '10px 12px', background: '#0f0f1a', border: '1px solid #2a2a3e', borderRadius: '6px', color: '#e0e0e0', fontSize: '16px', marginBottom: '12px', display: 'block' };
  var btnStyle = { width: '100%', padding: '12px', background: '#a3e635', color: '#0a0a14', border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', marginBottom: '8px' };
  var planColors = { free: '#888', pro: '#4d9fff', edge: '#a3e635' };

  async function handleSignIn() {
    setLoading(true); setMessage('');
    var res = await supabase.auth.signInWithPassword({ email: email, password: password });
    if (res.error) setMessage(res.error.message);
    else { setUser(res.data.user); setMessage('Signed in.'); }
    setLoading(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setUser(null); setPlan('free'); setMessage('Signed out.');
  }

  if (user) {
    return React.createElement('div', { className: 'page' },
      React.createElement('h1', { style: { marginBottom: '24px', fontSize: '28px' } }, 'Account'),
      React.createElement('div', { className: 'card' },
        React.createElement('p', { style: { color: '#888', marginBottom: '8px' } }, user.email),
        React.createElement('p', null, 'Plan: ', React.createElement('span', { style: { color: planColors[plan] || '#888', fontWeight: '700', textTransform: 'uppercase' } }, plan)),
        React.createElement('button', { onClick: handleSignOut, style: Object.assign({}, btnStyle, { marginTop: '16px', background: 'none', border: '1px solid #444', color: '#ccc' }) }, 'Sign Out')
      ),
      message && React.createElement('p', { style: { marginTop: '12px', color: '#888' } }, message)
    );
  }

  return React.createElement('div', { className: 'page' },
    React.createElement('div', { style: { maxWidth: '400px', margin: '0 auto' } },
      React.createElement('h1', { style: { marginBottom: '24px', fontSize: '28px' } }, 'Sign In'),
      React.createElement('div', { className: 'card' },
        React.createElement('input', { type: 'email', placeholder: 'Email', value: email, onChange: function(e) { setEmail(e.target.value); }, style: inputStyle }),
        React.createElement('input', { type: 'password', placeholder: 'Password', value: password, onChange: function(e) { setPassword(e.target.value); }, style: inputStyle }),
        React.createElement('button', { onClick: handleSignIn, disabled: loading, style: btnStyle }, loading ? 'Signing in...' : 'Sign In'),
        message && React.createElement('p', { style: { color: '#ff6b6b', fontSize: '14px', marginTop: '8px' } }, message),
        React.createElement('p', { style: { color: '#666', fontSize: '13px', marginTop: '12px', textAlign: 'center' } },
          'No account? ', React.createElement('a', { href: '/join', style: { color: '#a3e635' } }, 'Join RaceEdge')
        )
      )
    )
  );
}
