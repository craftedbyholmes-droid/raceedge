import { NextResponse } from 'next/server';
import supabase from '../../../../lib/supabase.js';
import { bestFractionalOdds, bestDecimalOdds, getAllBookmakerOdds } from '../../../../lib/odds.js';

// Cache stores top 2 runners per race only
// Personas MUST use runners table for gap calculation - never this cache
// Must run AFTER /api/cron/score
// Mistake #7: previously ran before scoring

function checkSecret(request) {
  const auth = request.headers.get('authorization') || '';
  return auth === 'Bearer ' + process.env.CRON_SECRET;
}

async function buildCache(date, cacheKey) {
  const { data: races, error: raceErr } = await supabase.from('races').select('*').eq('race_date', date).order('off_time');
  if (raceErr) throw new Error('Races query: ' + raceErr.message);
  if (!races || races.length === 0) return { races: 0, runners: 0 };

  const { data: runners, error: runErr } = await supabase
    .from('runners')
    .select('runner_id, race_id, horse_name, jockey, trainer, age, draw, form, rpr, race_type, race_date, odds_raw, scores(total, scores)')
    .eq('race_date', date);
  if (runErr) throw new Error('Runners query: ' + runErr.message);

  const byRace = {};
  for (const r of (runners || [])) {
    if (!byRace[r.race_id]) byRace[r.race_id] = [];
    const score = (r.scores && r.scores[0]) ? r.scores[0].total : 0;
    byRace[r.race_id].push(Object.assign({}, r, { total: score }));
  }

  const cacheRaces = [];
  let totalRunners = 0;

  for (const race of races) {
    const raceRunners = (byRace[race.race_id] || []).sort(function(a, b) { return b.total - a.total; });
    const limit = race.field_size <= 5 ? 1 : 2;
    const topRunners = raceRunners.slice(0, limit).map(function(r) {
      const oddsArr = (r.odds_raw && r.odds_raw.odds) ? r.odds_raw.odds : [];
      return {
        runner_id: r.runner_id, horse_name: r.horse_name, jockey: r.jockey,
        trainer: r.trainer, age: r.age, draw: r.draw, form: r.form, rpr: r.rpr,
        total: r.total, scores: (r.scores && r.scores[0]) ? r.scores[0].scores : {},
        best_frac: bestFractionalOdds(oddsArr), best_dec: bestDecimalOdds(oddsArr),
        bookmakers: getAllBookmakerOdds(oddsArr),
      };
    });
    cacheRaces.push({
      race_id: race.race_id, course: race.course, race_name: race.race_name,
      race_type: race.race_type, going: race.going, distance_furlongs: race.distance_furlongs,
      off_time: race.off_time, field_size: race.field_size, race_date: race.race_date,
      runners: topRunners,
    });
    totalRunners += topRunners.length;
  }

  const { error: cacheErr } = await supabase.from('cache').upsert({
    key: cacheKey, value: cacheRaces, date: date, updated_at: new Date().toISOString(),
  }, { onConflict: 'key' });
  if (cacheErr) throw new Error('Cache upsert: ' + cacheErr.message);

  return { races: cacheRaces.length, runners: totalRunners };
}

export async function GET(request) {
  if (!checkSecret(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const today = new Date().toISOString().split('T')[0];
  const tom = new Date(); tom.setDate(tom.getDate() + 1);
  const tomorrow = tom.toISOString().split('T')[0];

  const errors = [];
  const results = {};
  try { results.today = await buildCache(today, 'races_today'); } catch (err) { errors.push('Today: ' + err.message); }
  try { results.tomorrow = await buildCache(tomorrow, 'races_tomorrow'); } catch (err) { errors.push('Tomorrow: ' + err.message); }

  return NextResponse.json({ success: errors.length === 0, ...results, errors, timestamp: new Date().toISOString() });
}