'use client';
import { createContext, useContext, useState } from 'react';

const OddsCtx = createContext({ mode: 'fractional', toggle: () => {} });
export const useOdds = () => useContext(OddsCtx);

export function OddsProvider({ children }) {
  const [mode, setMode] = useState('fractional');
  const toggle = () => setMode(m => m === 'fractional' ? 'decimal' : 'fractional');
  return (
    <OddsCtx.Provider value={{ mode, toggle }}>
      {children}
    </OddsCtx.Provider>
  );
}

export function OddsToggleButton() {
  const { mode, toggle } = useOdds();
  return (
    <button onClick={toggle} className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 12 }}>
      {mode === 'fractional' ? 'Decimal' : 'Fractional'}
    </button>
  );
}