'use client';

import React, { createContext, useContext, useState } from 'react';

const OddsContext = createContext({ showDecimal: false, toggle: function() {} });

export function OddsProvider(props) {
  const [showDecimal, setShowDecimal] = useState(false);
  function toggle() { setShowDecimal(function(prev) { return !prev; }); }
  return React.createElement(OddsContext.Provider, { value: { showDecimal: showDecimal, toggle: toggle } }, props.children);
}

export function useOdds() {
  return useContext(OddsContext);
}

export function OddsToggleButton() {
  const ctx = useContext(OddsContext);
  return React.createElement('button', {
    onClick: ctx.toggle,
    style: {
      background: 'none',
      border: '1px solid #444',
      color: '#ccc',
      borderRadius: '4px',
      padding: '4px 10px',
      fontSize: '13px',
      cursor: 'pointer',
    }
  }, ctx.showDecimal ? 'Fractional' : 'Decimal');
}
