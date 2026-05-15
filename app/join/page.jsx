'use client';

import React, { useState } from 'react';
import { createAuthClient } from '../../lib/supabaseAuth.js';

export default function JoinPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const supabase = createAuthClient();

  var inputStyle = { width: '100%', padding: '10px 12px', background: '#0f0f1a', border: '1px solid #2a2a3e', borderRadius: '6px', color: '#e0e0e0', fontSize: '16px', marginBottom: '12px', display: 'block' };
  var btnStyle = { width: '100%', padding: '12px', background: '#a3e635', color: '#0a0a14', border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: '700', cursor: 'pointer' };

  async function handleJoin() {
    setLoading(true); setMessage('');
    var res = await supabase.auth.signUp({ email: email, password: password });
    if (res.error) setMessage(res.error.message);
    else setMessage('Account created. Check your email to confirm.');
    setLoading(false);
  }

  return React.createElement('div', { className: 'page' },
    React.createElement('div', { style: { maxWidth: '400px', margin: '0 auto' } },
      React.createElement('h1', { style: { marginBottom: '8px', fontSize: '28px' } }, 'Join RaceEdge'),
      React.createElement('p', { style: { color: '#888', marginBottom: '24px' } }, 'Create your free account'),
      React.createElement('div', { className: 'card' },
        React.createElement('input', { type: 'email', placeholder: 'Email', value: email, onChange: function(e) { setEmail(e.target.value); }, style: inputStyle }),
        React.createElement('input', { type: 'password', placeholder: 'Password (min 8 characters)', value: password, onChange: function(e) { setPassword(e.target.value); }, style: inputStyle }),
        React.createElement('button', { onClick: handleJoin, disabled: loading, style: btnStyle }, loading ? 'Creating account...' : 'Create Account'),
        message && React.createElement('p', { style: { color: message.includes('created') ? '#a3e635' : '#ff6b6b', fontSize: '14px', marginTop: '12px' } }, message),
        React.createElement('p', { style: { color: '#666', fontSize: '13px', marginTop: '12px', textAlign: 'center' } },
          'Already have an account? ', React.createElement('a', { href: '/account', style: { color: '#a3e635' } }, 'Sign in')
        )
      )
    )
  );
}
