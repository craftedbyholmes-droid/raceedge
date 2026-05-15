import { NextResponse } from 'next/server';
import supabase from '../../../lib/supabase.js';
import { fetchRacecards, fetchResults } from '../../../lib/racingApi.js';

// Cron order: 1. Fetch (this) -> 2. Score -> 3. Cache -> 4. Picks
// Mistake #7: cache was built before scoring - order is critical
// UK/IRE filter applied inside fetchRacecards() and fetchResults() at source

function checkSecret(request) {
  const auth = request.headers.get('authorization') || '';
  return auth === 'Bearer ' + process.env.CRON_SECRET;
}

export async function GET(request) {
  if (!checkSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results = { today: null, tomorrow: null, results: null, errors: [] };

  try {
    const todayRaces = await fetchRacecards('today');
    results.today = { races: todayRaces.length, runners: 0 };
    for (const race of todayRaces) {
      const { error: raceErr } = await supabase.from('races').upsert({
        race_id: race.race_id, course: race.course, race_name: race.race_name,
        race_type: race.race_type, going: race.going, distance_furlongs: race.distance_furlongs,
        off_time: race.off_time, field_size: race.field_size, race_date: race.race_date,
      }, { onConflict: 'race_id' });
      if (raceErr) { results.errors.push('Race upsert ' + race.race_id + ': ' + raceErr.message); continue; }
      if (race.runners.length > 0) {
        const { error: runErr } = await supabase.from('runners').upsert(race.runners, { onConflict: 'runner_id' });
        if (runErr) results.errors.push('Runners upsert ' + race.race_id + ': ' + runErr.message);
        else results.today.runners += race.runners.length;
      }
    }
  } catch (err) { results.errors.push('Today fetch failed: ' + err.message); }

  try {
    const tomorrowRaces = await fetchRacecards('tomorrow');
    results.tomorrow = { races: tomorrowRaces.length, runners: 0 };
    for (const race of tomorrowRaces) {
      const { error: raceErr } = await supabase.from('races').upsert({
        race_id: race.race_id, course: race.course, race_name: race.race_name,
        race_type: race.race_type, going: race.going, distance_furlongs: race.distance_furlongs,
        off_time: race.off_time, field_size: race.field_size, race_date: race.race_date,
      }, { onConflict: 'race_id' });
      if (raceErr) { results.errors.push('Tomorrow race upsert ' + race.race_id + ': ' + raceErr.message); continue; }
      if (race.runners.length > 0) {
        const { error: runErr } = await supabase.from('runners').upsert(race.runners, { onConflict: 'runner_id' });
        if (runErr) results.errors.push('Tomorrow runners upsert ' + race.race_id + ': ' + runErr.message);
        else results.tomorrow.runners += race.runners.length;
      }
    }
  } catch (err) { results.errors.push('Tomorrow fetch failed: ' + err.message); }

  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];
    const resultRows = await fetchResults(dateStr);
    results.results = { date: dateStr, rows: resultRows.length };
    if (resultRows.length > 0) {
      const { error: resErr } = await supabase.from('results').upsert(resultRows, { onConflict: 'result_id' });
      if (resErr) results.errors.push('Results upsert: ' + resErr.message);
    }
  } catch (err) { results.errors.push('Results fetch failed: ' + err.message); }

  return NextResponse.json({ success: results.errors.length === 0, ...results, timestamp: new Date().toISOString() });
}