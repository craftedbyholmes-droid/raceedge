const WEIGHTS = {
  Flat:   { recentForm:0.21, marketSignal:0.20, speedRating:0.13, distanceSuit:0.11, goingSuitability:0.11, drawBias:0.07, trainerForm:0.07, jockeyForm:0.04, courseDist:0.04, runningStyleFit:0.02, careerPhase:0.00 },
  Hurdle: { recentForm:0.24, goingSuitability:0.17, distanceSuit:0.16, marketSignal:0.12, trainerForm:0.10, courseDist:0.08, speedRating:0.07, jockeyForm:0.03, runningStyleFit:0.02, careerPhase:0.01, drawBias:0.00 },
  Chase:  { recentForm:0.22, goingSuitability:0.18, distanceSuit:0.17, courseDist:0.12, trainerForm:0.08, marketSignal:0.08, jockeyForm:0.04, speedRating:0.05, runningStyleFit:0.03, careerPhase:0.03, drawBias:0.00 }
};

function parseForm(f) {
  if (!f) return 50;
  const chars = f.replace(/[-\/PpFfUu]/g, '').slice(-5).split('');
  if (!chars.length) return 50;
  let score = 0;
  chars.forEach((c, i) => {
    const w = (i + 1) / chars.length;
    if (c === '1') score += 100 * w;
    else if (c === '2') score += 75 * w;
    else if (c === '3') score += 55 * w;
    else if (c === '4') score += 35 * w;
    else score += 20 * w;
  });
  return Math.min(100, score);
}

function marketSignal(runner) {
  const known = ['Bet365','William Hill','Ladbrokes','Coral','Paddy Power','Betfred'];
  const odds = (runner.odds_raw && runner.odds_raw.odds) ? runner.odds_raw.odds : [];
  let best = null;
  for (const bm of known) {
    const found = odds.find(o => o.bookmaker === bm);
    if (found) { best = parseFloat(found.decimal); break; }
  }
  if (!best && odds.length) best = parseFloat(odds[0].decimal);
  if (!best) return 50;
  if (best <= 2) return 90;
  if (best <= 4) return 75;
  if (best <= 7) return 60;
  if (best <= 11) return 45;
  if (best <= 16) return 30;
  return 15;
}

export function scoreRunner(runner, race) {
  const type = race.race_type || 'Flat';
  const weights = WEIGHTS[type] || WEIGHTS.Flat;
  const factors = {
    recentForm:     parseForm(runner.form),
    marketSignal:   marketSignal(runner),
    speedRating:    runner.rpr ? Math.min(100, runner.rpr / 1.3) : 50,
    distanceSuit:   60,
    goingSuitability: 60,
    drawBias:       runner.draw ? (runner.draw <= 4 ? 70 : 50) : 50,
    trainerForm:    55,
    jockeyForm:     55,
    courseDist:     55,
    runningStyleFit: 55,
    careerPhase:    55,
  };
  let total = 0;
  for (const key of Object.keys(weights)) {
    total += (factors[key] || 50) * weights[key];
  }
  return { scores: factors, total: Math.round(total * 10) / 10 };
}