'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function LandingPage() {
  const [gdprDismissed, setGdprDismissed] = useState(true);

  useEffect(function() {
    var dismissed = localStorage.getItem('raceedge_gdpr');
    if (!dismissed) setGdprDismissed(false);
  }, []);

  function dismissGdpr() {
    localStorage.setItem('raceedge_gdpr', '1');
    setGdprDismissed(true);
  }

  var heroStyle = { textAlign: 'center', padding: '80px 16px 60px', maxWidth: '960px', margin: '0 auto' };
  var h1Style = { fontSize: '48px', fontWeight: '800', color: '#a3e635', marginBottom: '16px', lineHeight: '1.1' };
  var subStyle = { fontSize: '18px', color: '#888', maxWidth: '600px', margin: '0 auto 36px' };
  var featureGrid = { maxWidth: '960px', margin: '0 auto', padding: '0 16px 60px', display: 'flex', gap: '16px', flexWrap: 'wrap' };
  var featureCard = { flex: '1', minWidth: '240px', background: '#12121f', border: '1px solid #1e1e35', borderRadius: '8px', padding: '24px' };
  var gdprStyle = { position: 'fixed', bottom: '0', left: '0', right: '0', background: '#12121f', borderTop: '1px solid #1e1e35', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', zIndex: '200' };

  return React.createElement('div', null,
    React.createElement('div', { style: heroStyle },
      React.createElement('h1', { style: h1Style }, 'Horse Racing Intelligence'),
      React.createElement('p', { style: subStyle }, 'Data-driven selections for UK and Ireland racing.'),
      React.createElement('div', { style: { display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' } },
        React.createElement(Link, { href: '/dashboard', style: { display: 'inline-block', background: '#a3e635', color: '#0a0a14', padding: '12px 28px', borderRadius: '6px', fontWeight: '700', fontSize: '16px' } }, 'Today\u0027s Races'),
        React.createElement(Link, { href: '/pricing', style: { display: 'inline-block', background: 'none', border: '1px solid #444', color: '#ccc', padding: '12px 28px', borderRadius: '6px', fontWeight: '600', fontSize: '16px' } }, 'See Plans')
      )
    ),
    React.createElement('div', { style: featureGrid },
      React.createElement('div', { style: featureCard },
        React.createElement('h3', { style: { marginBottom: '8px' } }, 'UK and Ireland Only'),
        React.createElement('p', { style: { color: '#666', fontSize: '14px' } }, 'Every race from British and Irish tracks, filtered and scored daily.')
      ),
      React.createElement('div', { style: featureCard },
        React.createElement('h3', { style: { marginBottom: '8px' } }, 'Model-Driven Tips'),
        React.createElement('p', { style: { color: '#666', fontSize: '14px' } }, 'Form, market signals, going and trainer stats combined into a single score.')
      ),
      React.createElement('div', { style: featureCard },
        React.createElement('h3', { style: { marginBottom: '8px' } }, 'Robbie vs Pat'),
        React.createElement('p', { style: { color: '#666', fontSize: '14px' } }, 'Two tipsters competing all season - jumps and flat.')
      )
    ),
    !gdprDismissed && React.createElement('div', { style: gdprStyle },
      React.createElement('p', { style: { color: '#888', fontSize: '13px' } }, 'We use cookies to improve your experience.'),
      React.createElement('button', { onClick: dismissGdpr, style: { background: '#a3e635', color: '#0a0a14', border: 'none', borderRadius: '4px', padding: '8px 16px', fontWeight: '600', fontSize: '13px', cursor: 'pointer' } }, 'Accept')
    )
  );
}
