export function fracToDecimal(frac) {
  if (!frac || !frac.includes('/')) return parseFloat(frac) || 0;
  const parts = frac.split('/');
  const n = Number(parts[0]);
  const d = Number(parts[1]);
  return Math.round((n / d + 1) * 100) / 100;
}

export function bestOdds(oddsArray) {
  if (!oddsArray || !oddsArray.length) return { fractional: 'N/A', decimal: null };
  const known = ['Bet365','William Hill','Ladbrokes','Coral','Paddy Power','Betfred'];
  let pick = null;
  for (const bm of known) {
    pick = oddsArray.find(o => o.bookmaker === bm);
    if (pick) break;
  }
  if (!pick) pick = oddsArray[0];
  return { fractional: pick.fractional, decimal: pick.decimal, bookmaker: pick.bookmaker };
}