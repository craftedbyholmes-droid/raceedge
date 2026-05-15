'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { OddsToggleButton } from './OddsToggle.jsx';

export default function NavAndTicker() {
  const [isMobile, setIsMobile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [ticker, setTicker] = useState([]);

  useEffect(function() {
    function check() { setIsMobile(window.innerWidth <= 768); }
    check();
    window.addEventListener('resize', check);
    return function() { window.removeEventListener('resize', check); };
  }, []);

  useEffect(function() {
    fetch('/api/stats')
      .then(function(r) { return r.json(); })
      .then(function(data) {
        var picks = (data.picks || []).filter(function(p) { return p.position !== null && !p.is_nr; });
        setTicker(picks.slice(0, 20));
      })
      .catch(function() {});
  }, []);

  var navLinks = [
    { href: '/dashboard', label: 'Today' },
    { href: '/tomorrow', label: 'Tomorrow' },
    { href: '/tipsters', label: 'Tipsters' },
    { href: '/results', label: 'Results' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/account', label: 'Account' },
  ];

  var navStyle = { background: '#0f0f1a', borderBottom: '1px solid #222', position: 'sticky', top: '0', zIndex: '100' };
  var innerStyle = { maxWidth: '960px', margin: '0 auto', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '52px' };
  var logoStyle = { color: '#a3e635', fontWeight: '700', fontSize: '20px', textDecoration: 'none', letterSpacing: '1px' };
  var linkStyle = { color: '#ccc', textDecoration: 'none', fontSize: '14px', padding: '0 10px' };
  var hamburgerStyle = { background: 'none', border: 'none', color: '#ccc', fontSize: '22px', cursor: 'pointer', padding: '4px 8px' };
  var mobileMenuStyle = { background: '#0f0f1a', borderBottom: '1px solid #222', padding: '12px 16px', display: menuOpen ? 'flex' : 'none', flexDirection: 'column', gap: '12px' };
  var tickerStyle = { background: '#0a0a14', borderBottom: '1px solid #1a1a2e', padding: '6px 0', overflow: 'hidden', whiteSpace: 'nowrap', fontSize: '12px', color: '#888' };
  var tickerInnerStyle = { display: 'inline-block', paddingLeft: '100%', animation: ticker.length > 0 ? 'ticker 40s linear infinite' : 'none' };

  function getResultColor(p) {
    if (p.position === 1) return '#a3e635';
    if (p.position <= 3) return '#4d9fff';
    return '#888';
  }

  function getResultLabel(p) {
    if (p.position === 1) return 'WON';
    if (p.position === 2) return '2nd';
    if (p.position === 3) return '3rd';
    return p.position + 'th';
  }

  var tickerItems = ticker.map(function(p, i) {
    return React.createElement('span', { key: i, style: { marginRight: '40px' } },
      React.createElement('span', { style: { color: p.persona === 'AJ' ? '#a3e635' : '#4d9fff', marginRight: '6px' } }, p.persona === 'AJ' ? 'Robbie' : 'Pat'),
      React.createElement('span', { style: { color: '#ccc', marginRight: '6px' } }, p.horse_name),
      React.createElement('span', { style: { color: '#666', marginRight: '6px' } }, p.course),
      React.createElement('span', { style: { color: getResultColor(p), fontWeight: '600' } }, getResultLabel(p))
    );
  });

  return React.createElement('div', null,
    React.createElement('nav', { style: navStyle },
      React.createElement('div', { style: innerStyle },
        React.createElement(Link, { href: '/', style: logoStyle }, 'RACEEDGE'),
        isMobile
          ? React.createElement('button', { style: hamburgerStyle, onClick: function() { setMenuOpen(function(o) { return !o; }); } }, menuOpen ? 'x' : '=')
          : React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '4px' } },
              navLinks.map(function(l) { return React.createElement(Link, { key: l.href, href: l.href, style: linkStyle }, l.label); }),
              React.createElement('div', { style: { marginLeft: '12px' } }, React.createElement(OddsToggleButton))
            )
      ),
      isMobile && React.createElement('div', { style: mobileMenuStyle },
        navLinks.map(function(l) { return React.createElement(Link, { key: l.href, href: l.href, style: Object.assign({}, linkStyle, { padding: '4px 0' }), onClick: function() { setMenuOpen(false); } }, l.label); }),
        React.createElement(OddsToggleButton)
      )
    ),
    React.createElement('div', { style: tickerStyle },
      ticker.length > 0
        ? React.createElement('div', { style: tickerInnerStyle }, tickerItems)
        : React.createElement('div', { style: { padding: '0 16px', color: '#555' } }, 'Results will appear here as races settle today')
    ),
    React.createElement('style', null, '@keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-100%); } }')
  );
}
