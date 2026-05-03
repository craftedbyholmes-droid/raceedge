const WEIGHTS = {
  Flat: {
    recentForm:       0.20,
    marketSignal:     0.10,
    speedRating:      0.13,
    officialRating:   0.07,
    distanceSuit:     0.10,
    goingSuitability: 0.10,
    drawBias:         0.07,
    trainerForm:      0.09,
    jockeyForm:       0.06,
    courseDist:       0.04,
    runningStyleFit:  0.02,
    careerPhase:      0.02,
  },
  Hurdle: {
    recentForm:       0.22,
    goingSuitability: 0.16,
    distanceSuit:     0.15,
    marketSignal:     0.06,
    trainerForm:      0.12,
    courseDist:       0.08,
    speedRating:      0.07,
    officialRating:   0.05,
    jockeyForm:       0.05,
    runningStyleFit:  0.02,
    careerPhase:      0.02,
    drawBias:         0.00,
  },
  Chase: {
    recentForm:       0.21,
    goingSuitability: 0.17,
    distanceSuit:     0.16,
    courseDist:       0.12,
    trainerForm:      0.10,
    marketSignal:     0.04,
    jockeyForm:       0.06,
    speedRating:      0.07,
    officialRating:   0.04,
    runningStyleFit:  0.03,
    careerPhase:      0.05,
    drawBias:         0.00,
  },
};

function parseForm(f) {
  if (!f) return 50;
  const chars = f.replace(/[-\/PpFfUuRr]/g, '').slice(-5).split('');
  if (!chars.length) return 50;
  let score = 0;
  chars.forEach((c, i) => {
    const w = (i + 1) / chars.length;
    if      (c === '1') score += 100 * w;
    else if (c === '2') score += 75  * w;
    else if (c === '3') score += 55  * w;
    else if (c === '4') score += 35  * w;
    else                score += 20  * w;
  });
  return Math.min(100, score);
}

function marketSignal(oddsArray) {
  if (!Array.isArray(oddsArray) || !oddsArray.length) return 50;
  const known = ['Bet365', 'William Hill', 'Ladbrokes', 'Coral', 'Paddy Power', 'Betfred'];
  let best = null;
  for (const bm of known) {
    const found = oddsArray.find(
      o => o.bookmaker === bm && o.decimal && o.decimal !== '-' && o.decimal !== 'SP'
    );
    if (found) { best = parseFloat(found.decimal); break; }
  }
  if (!best) {
    const any = oddsArray.find(o => o.decimal && o.decimal !== '-' && o.decimal !== 'SP');
    if (any) best = parseFloat(any.decimal);
  }
  if (!best || isNaN(best)) return 50;
  if (best <= 2)  return 92;
  if (best <= 3)  return 82;
  if (best <= 4)  return 74;
  if (best <= 6)  return 65;
  if (best <= 8)  return 57;
  if (best <= 11) return 48;
  if (best <= 16) return 38;
  if (best <= 20) return 28;
  return 18;
}

function trainerScore(runner) {
  const t = runner.odds_raw?.trainer_14_days;
  if (!t || t.runs === '0' || t.runs === 0) return 50;
  const pct = parseFloat(t.percent);
  if (isNaN(pct)) return 50;
  if (pct >= 30) return 90;
  if (pct >= 20) return 75;
  if (pct >= 15) return 65;
  if (pct >= 10) return 55;
  return 40;
}

function officialRating(runner) {
  const ofr = parseInt(runner.odds_raw?.ofr);
  if (ofr > 0) {
    if (ofr >= 120) return 90;
    if (ofr >= 105) return 78;
    if (ofr >= 90)  return 66;
    if (ofr >= 75)  return 55;
    if (ofr >= 60)  return 44;
    return 35;
  }
  const rpr = parseInt(runner.rpr);
  if (rpr > 0) return Math.min(90, Math.round(rpr / 1.3));
  return 50;
}

export function scoreRunner(runner, race) {
  const type    = race.race_type || 'Flat';
  const weights = WEIGHTS[type] || WEIGHTS.Flat;

  // odds are inside odds_raw.odds - odds_raw is the full runner object from API
  const odds = runner.odds_raw?.odds || [];

  const factors = {
    recentForm:       parseForm(runner.form),
    marketSignal:     marketSignal(odds),
    speedRating:      runner.rpr ? Math.min(100, runner.rpr / 1.3) : 50,
    officialRating:   officialRating(runner),
    distanceSuit:     60,
    goingSuitability: 60,
    drawBias:         runner.draw ? (runner.draw <= 4 ? 72 : runner.draw <= 8 ? 55 : 44) : 50,
    trainerForm:      trainerScore(runner),
    jockeyForm:       55,
    courseDist:       55,
    runningStyleFit:  55,
    careerPhase:      55,
  };

  let total = 0;
  for (const key of Object.keys(weights)) {
    total += (factors[key] || 50) * weights[key];
  }
  return { scores: factors, total: Math.round(total * 10) / 10 };
}