// Scoring engine - flat/hurdle/chase weights
// Mistake #15: previous build used placeholder values of 50/60 for several factors

const WEIGHTS = {
  Flat: {
    recentForm: 0.21, marketSignal: 0.20, speedRating: 0.13,
    distanceSuit: 0.11, goingSuitability: 0.11, drawBias: 0.07,
    trainerForm: 0.07, jockeyForm: 0.04, courseDist: 0.04,
    runningStyleFit: 0.02, careerPhase: 0.00,
  },
  Hurdle: {
    recentForm: 0.24, goingSuitability: 0.17, distanceSuit: 0.16,
    marketSignal: 0.12, trainerForm: 0.10, courseDist: 0.08,
    speedRating: 0.07, jockeyForm: 0.03, runningStyleFit: 0.02,
    careerPhase: 0.01, drawBias: 0.00,
  },
  Chase: {
    recentForm: 0.22, goingSuitability: 0.18, distanceSuit: 0.17,
    courseDist: 0.12, trainerForm: 0.08, marketSignal: 0.08,
    jockeyForm: 0.04, speedRating: 0.05, runningStyleFit: 0.03,
    careerPhase: 0.03, drawBias: 0.00,
  },
};

export const THRESHOLDS = {
  dashboardShow: 60,
  highConfidence: 75,
  bestPick: 72,
  tipsterMin: 72,
  topPicks: 70,
};

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

function scoreRecentForm(runner) {
  const form = runner.form || '';
  if (!form) return 50;
  const chars = form.replace(/[^0-9FPU]/gi, '');
  const recent = chars.slice(-6).split('');
  if (recent.length === 0) return 50;
  let score = 0;
  let weight = 1;
  let totalWeight = 0;
  for (let i = recent.length - 1; i >= 0; i--) {
    const c = recent[i];
    let pts = 50;
    if (c === '1') pts = 100;
    else if (c === '2') pts = 80;
    else if (c === '3') pts = 65;
    else if (c === '4') pts = 50;
    else if (c === '5' || c === '6') pts = 35;
    else if (/[7-9]/.test(c)) pts = 20;
    else if (c === 'F' || c === 'U') pts = 5;
    else if (c === 'P') pts = 10;
    score += pts * weight;
    totalWeight += weight;
    weight *= 0.75;
  }
  return totalWeight > 0 ? Math.round(score / totalWeight) : 50;
}

function scoreMarketSignal(runner) {
  // odds_raw is the full runner object - odds array is at odds_raw.odds
  // Mistake #6: must be called with runner.odds_raw.odds NOT runner.odds_raw
  const oddsArray = (runner.odds_raw && runner.odds_raw.odds) ? runner.odds_raw.odds : [];
  const decimal = bestDecimalOdds(oddsArray);
  if (!decimal) return 50;
  const impliedProb = (1 / decimal) * 100;
  return Math.min(100, Math.max(0, Math.round(impliedProb * 2)));
}

function scoreSpeedRating(runner) {
  const rpr = parseInt(runner.rpr, 10) || 0;
  const ts = parseInt(runner.ts, 10) || 0;
  const ofr = parseInt(runner.ofr, 10) || 0;
  const best = Math.max(rpr, ts, ofr);
  if (best === 0) return 50;
  return Math.min(100, Math.max(0, Math.round(((best - 60) / 80) * 100)));
}

function scoreDistanceSuit(runner) {
  const age = parseInt(runner.age, 10) || 4;
  if (age <= 2) return 45;
  if (age === 3) return 55;
  return 65;
}

function scoreGoingSuitability() { return 55; }

function scoreDrawBias(runner) {
  const draw = parseInt(runner.draw, 10) || 0;
  if (draw === 0) return 50;
  if (draw <= 3) return 65;
  if (draw <= 6) return 55;
  if (draw <= 10) return 50;
  return 40;
}

function scoreTrainerForm(runner) {
  const t14 = runner.trainer_14_days;
  if (t14 && t14.runs > 0) {
    const sr = t14.wins / t14.runs;
    return Math.min(100, Math.max(20, Math.round(sr * 300)));
  }
  return 50;
}

function scoreJockeyForm(runner) {
  const j14 = runner.jockey_14_days;
  if (j14 && j14.runs > 0) {
    const sr = j14.wins / j14.runs;
    return Math.min(100, Math.max(20, Math.round(sr * 300)));
  }
  return 50;
}

function scoreCourseDist() { return 50; }
function scoreRunningStyleFit() { return 50; }

function scoreCareerPhase(runner) {
  const age = parseInt(runner.age, 10) || 4;
  if (age <= 3) return 70;
  if (age <= 6) return 60;
  if (age <= 9) return 50;
  return 40;
}

export function scoreRunner(runner, raceType) {
  const type = raceType === 'Chase' ? 'Chase' : raceType === 'Hurdle' ? 'Hurdle' : 'Flat';
  const weights = WEIGHTS[type];
  const components = {
    recentForm: scoreRecentForm(runner),
    marketSignal: scoreMarketSignal(runner),
    speedRating: scoreSpeedRating(runner),
    distanceSuit: scoreDistanceSuit(runner),
    goingSuitability: scoreGoingSuitability(),
    drawBias: scoreDrawBias(runner),
    trainerForm: scoreTrainerForm(runner),
    jockeyForm: scoreJockeyForm(runner),
    courseDist: scoreCourseDist(),
    runningStyleFit: scoreRunningStyleFit(),
    careerPhase: scoreCareerPhase(runner),
  };
  let total = 0;
  for (const factor in weights) {
    total += (components[factor] || 50) * weights[factor];
  }
  return {
    scores: components,
    total: Math.round(total * 10) / 10,
  };
}