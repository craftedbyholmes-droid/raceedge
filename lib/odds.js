// Odds utilities
// Fractional odds are already fractional in odds_raw.odds[].fractional - no conversion needed
// Mistake #6: bestOdds must be called with runner.odds_raw.odds NOT runner.odds_raw

const PREFERRED_BOOKMAKERS = ['bet365', 'william hill', 'ladbrokes', 'coral', 'paddy power', 'betfred'];

export function bestDecimalOdds(oddsArray) {
  if (!Array.isArray(oddsArray) || oddsArray.length === 0) return null;
  const preferred = oddsArray.filter(function(o) {
    return PREFERRED_BOOKMAKERS.indexOf((o.bookmaker || '').toLowerCase()) !== -1;
  });
  const pool = preferred.length > 0 ? preferred : oddsArray;
  let best = 0;
  for (const o of pool) {
    const dec = parseFloat(o.decimal);
    if (!isNaN(dec) && dec > best) best = dec;
  }
  return best > 0 ? best : null;
}

export function bestFractionalOdds(oddsArray) {
  if (!Array.isArray(oddsArray) || oddsArray.length === 0) return null;
  let bestDec = 0;
  let bestFrac = null;
  for (const o of oddsArray) {
    const dec = parseFloat(o.decimal);
    if (!isNaN(dec) && dec > bestDec) {
      bestDec = dec;
      bestFrac = o.fractional || null;
    }
  }
  return bestFrac;
}

export function getAllBookmakerOdds(oddsArray) {
  if (!Array.isArray(oddsArray) || oddsArray.length === 0) return [];
  return oddsArray
    .filter(function(o) { return o.bookmaker && (o.fractional || o.decimal); })
    .map(function(o) {
      return {
        bookmaker: o.bookmaker,
        fractional: o.fractional || null,
        decimal: o.decimal ? parseFloat(o.decimal) : null,
      };
    })
    .sort(function(a, b) { return (b.decimal || 0) - (a.decimal || 0); });
}

export function fractionalToDecimal(fractional) {
  if (!fractional) return null;
  if (fractional.toLowerCase() === 'evs') return 2.0;
  const parts = fractional.split('/');
  if (parts.length !== 2) return null;
  const num = parseFloat(parts[0]);
  const den = parseFloat(parts[1]);
  if (isNaN(num) || isNaN(den) || den === 0) return null;
  return Math.round((num / den + 1) * 100) / 100;
}

export function affiliateUrl(bookmaker) {
  const map = {
    'bet365': process.env.NEXT_PUBLIC_AFF_BET365,
    'william hill': process.env.NEXT_PUBLIC_AFF_WILLIAMHILL,
    'ladbrokes': process.env.NEXT_PUBLIC_AFF_LADBROKES,
    'coral': process.env.NEXT_PUBLIC_AFF_CORAL,
    'paddy power': process.env.NEXT_PUBLIC_AFF_PADDYPOWER,
    'betfred': process.env.NEXT_PUBLIC_AFF_BETFRED,
  };
  return map[(bookmaker || '').toLowerCase()] || null;
}