export function fracToDecimal(frac) {
  if (!frac || frac === '-' || frac === 'SP') return null;
  if (!frac.includes('/')) return parseFloat(frac) || null;
  const parts = frac.split('/');
  return Math.round((Number(parts[0]) / Number(parts[1]) + 1) * 100) / 100;
}

// Pass runner.odds_raw.odds (the array) to this function
export function bestOdds(oddsArray) {
  if (!oddsArray || !oddsArray.length) return { fractional: null, decimal: null, bookmaker: null };
  const known = ['Bet365','William Hill','Ladbrokes','Coral','Paddy Power','Betfred'];
  let pick = null;
  for (const bm of known) {
    const found = oddsArray.find(o => o.bookmaker === bm && o.fractional && o.fractional !== '-' && o.fractional !== 'SP');
    if (found) { pick = found; break; }
  }
  if (!pick) pick = oddsArray.find(o => o.fractional && o.fractional !== '-' && o.fractional !== 'SP');
  if (!pick) return { fractional: null, decimal: null, bookmaker: null };
  return {
    fractional: pick.fractional,
    decimal:    pick.decimal,
    bookmaker:  pick.bookmaker,
  };
}
