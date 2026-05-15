import supabase from './supabase.js';
import Anthropic from '@anthropic-ai/sdk';
import { bestFractionalOdds } from './odds.js';

export const PERSONAS = {
  AJ: {
    id: 'AJ',
    name: 'Rambling Robbie',
    colour: '#a3e635',
    raceTypes: ['Chase', 'Hurdle'],
    bio: 'Old school jumps man. Trusts the mud and does not mind a grey sky.',
  },
  TC: {
    id: 'TC',
    name: 'Punter Pat',
    colour: '#4d9fff',
    raceTypes: ['Flat'],
    bio: 'Flat specialist. Obsessed with draw bias and firm ground.',
  },
};

const STAKES = {
  bestPick: { win: 15, ew: 5, total: 20 },
  standard: { win: 5,  ew: 5, total: 10 },
};

export function getPlaceTerms(fieldSize) {
  return fieldSize >= 8 ? 3 : 2;
}

// selectPicks - reads ALL runners from runners table
// NEVER from cache - cache only has top 2 per race
// Mistake #18: previous build loaded from cache, broke gap calculation
export async function selectPicks(date, personaId) {
  const persona = PERSONAS[personaId];
  if (!persona) throw new Error('Unknown persona: ' + personaId);

  const { data: runners, error } = await supabase
    .from('runners')
    .select('runner_id, race_id, horse_name, course, race_type, race_date, odds_raw, scores(total, scores)')
    .eq('race_date', date)
    .in('race_type', persona.raceTypes);

  if (error) throw new Error('Runners query failed: ' + error.message);
  if (!runners || runners.length === 0) return [];

  const byRace = {};
  for (const runner of runners) {
    const score = (runner.scores && runner.scores[0]) ? runner.scores[0].total : 0;
    if (!byRace[runner.race_id]) byRace[runner.race_id] = [];
    byRace[runner.race_id].push(Object.assign({}, runner, { total: score }));
  }

  const candidates = [];
  for (const raceId in byRace) {
    const raceRunners = byRace[raceId].sort(function(a, b) { return b.total - a.total; });
    const top = raceRunners[0];
    const second = raceRunners[1];
    const gap = second ? top.total - second.total : top.total;
    if (top.total >= 72 || gap >= 8) {
      const oddsArr = (top.odds_raw && top.odds_raw.odds) ? top.odds_raw.odds : [];
      candidates.push({
        runner_id: top.runner_id,
        race_id: raceId,
        horse_name: top.horse_name,
        course: top.course,
        race_type: top.race_type,
        race_date: top.race_date,
        score: top.total,
        score_gap: Math.round(gap * 10) / 10,
        odds: bestFractionalOdds(oddsArr),
      });
    }
  }

  candidates.sort(function(a, b) { return b.score - a.score; });
  if (candidates.length < 2) return [];
  const picks = candidates.slice(0, 5);
  picks[0].is_best_pick = true;
  for (let i = 1; i < picks.length; i++) picks[i].is_best_pick = false;
  return picks;
}

export async function generateTipText(pick, persona) {
  const client = new Anthropic();
  const bestPickLine = pick.is_best_pick ? 'This is your BEST PICK of the day.' : '';
  const prompt = 'You are ' + persona.name + ', a horse racing tipster. Write a punchy 1-2 sentence tip for this selection. Be confident but not arrogant. Sound like a real person who loves racing.\n\nHorse: ' + pick.horse_name + '\nCourse: ' + pick.course + '\nRace type: ' + pick.race_type + '\nModel score: ' + pick.score + '/100\nScore gap over 2nd: ' + pick.score_gap + ' points\nOdds: ' + (pick.odds || 'N/A') + '\n' + bestPickLine + '\n\nWrite only the tip text, no labels or formatting.';
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 150,
    messages: [{ role: 'user', content: prompt }],
  });
  return (response.content[0] && response.content[0].text) ? response.content[0].text : '';
}

export function calcPnL(pick, result) {
  const stake = pick.is_best_pick ? STAKES.bestPick : STAKES.standard;
  if (result === null || result === 'NR') {
    return { win_return: stake.win, ew_return: stake.ew, total_return: stake.total, profit: 0, is_nr: true };
  }
  const position = parseInt(result.position, 10);
  const spDec = parseFloat(result.sp_decimal) || 1;
  const fieldSize = parseInt(result.field_size, 10) || 8;
  const places = getPlaceTerms(fieldSize);
  const ewOdds = (spDec - 1) / 4;
  let winReturn = 0;
  let ewReturn = 0;
  if (position === 1) winReturn = stake.win * spDec;
  if (position >= 1 && position <= places) ewReturn = stake.ew * (1 + ewOdds);
  const totalReturn = winReturn + ewReturn;
  return {
    win_return: Math.round(winReturn * 100) / 100,
    ew_return: Math.round(ewReturn * 100) / 100,
    total_return: Math.round(totalReturn * 100) / 100,
    profit: Math.round((totalReturn - stake.total) * 100) / 100,
    is_nr: false,
  };
}

export { STAKES };