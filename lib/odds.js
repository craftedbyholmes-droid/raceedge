export function fracToDecimal(frac) {
  if (!frac || !frac.includes('/')) return parseFloat(frac) || 0;
  const parts = frac.split('/');
  const n = Number(parts[0]);
  const d = Number(parts[1]);
  return Math.round((n / d + 1) * 100) / 100;
}

// odds_raw IS the full runner object from the API
// odds are at odds_raw.odds[]
export function bestOdds(runner) {
  const oddsArray = runner?.odds || runner?.odds_raw?.odds || [];
  if (!oddsArray || !oddsArray.length) return { fractional: null, decimal: null, bookmaker: null };
  const known = ['Bet365','William Hill','Ladbrokes','Coral','Paddy Power','Betfred'];
  let pick = null;
  for (const bm of known) {
    pick = oddsArray.find(o => o.bookmaker === bm);
    if (pick) break;
  }
  if (!pick) pick = oddsArray[0];
  return {
    fractional: pick.fractional || null,
    decimal:    pick.decimal    || null,
    bookmaker:  pick.bookmaker  || null,
  };
}
