'use client';

import React from 'react';
import Link from 'next/link';

export default function PricingPage() {
  var plans = [
    { name: 'FREE', price: '0', color: '#888', features: ['1 top pick per day', 'Bookmaker links shown', 'Results ticker visible'], cta: 'Get Started', href: '/join', highlight: false },
    { name: 'PRO', price: '9.99', color: '#4d9fff', features: ['All races grouped', 'Top 2 runners per race', 'Paginated top picks (70+)', 'Last 30 days history', 'Tipster picks visible'], cta: 'Go Pro', href: '/join', highlight: true },
    { name: 'EDGE', price: '24.99', color: '#a3e635', features: ['Everything in Pro', 'Live refresh button', 'Full results history', 'All tipster picks + history', 'Admin panel'], cta: 'Get Edge', href: '/join', highlight: false },
  ];

  return React.createElement('div', { className: 'page' },
    React.createElement('h1', { style: { textAlign: 'center', marginBottom: '8px', fontSize: '32px' } }, 'Plans'),
    React.createElement('p', { style: { textAlign: 'center', color: '#888', marginBottom: '40px' } }, 'Cancel any time.'),
    React.createElement('div', { style: { display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' } },
      plans.map(function(plan) {
        return React.createElement('div', { key: plan.name, style: { flex: '1', minWidth: '240px', maxWidth: '300px', background: '#12121f', border: '1px solid ' + (plan.highlight ? plan.color : '#1e1e35'), borderRadius: '10px', padding: '28px 24px' } },
          React.createElement('div', { style: { color: plan.color, fontWeight: '700', fontSize: '13px', letterSpacing: '1px', marginBottom: '8px' } }, plan.name),
          React.createElement('div', { style: { fontSize: '36px', fontWeight: '800', marginBottom: '20px' } }, plan.price === '0' ? 'Free' : String.fromCharCode(163) + plan.price + '/mo'),
          React.createElement('ul', { style: { listStyle: 'none', marginBottom: '24px' } },
            plan.features.map(function(f, i) {
              return React.createElement('li', { key: i, style: { color: '#ccc', fontSize: '14px', marginBottom: '10px', paddingLeft: '18px', position: 'relative' } },
                React.createElement('span', { style: { position: 'absolute', left: '0', color: plan.color } }, String.fromCharCode(10003)), f
              );
            })
          ),
          React.createElement(Link, { href: plan.href, style: { display: 'block', textAlign: 'center', padding: '11px', background: plan.highlight ? plan.color : 'none', border: plan.highlight ? 'none' : '1px solid #444', color: plan.highlight ? '#0a0a14' : '#ccc', borderRadius: '6px', fontWeight: '600', fontSize: '14px' } }, plan.cta)
        );
      })
    )
  );
}
