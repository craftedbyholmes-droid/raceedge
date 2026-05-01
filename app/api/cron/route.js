import { NextResponse } from 'next/server';
import supabase from '@/lib/supabase';
import { fetchRacecards } from '@/lib/racingApi';

export async function GET(req) {
  const secret = req.headers.get('authorization')?.replace('Bearer ', '');
  if (secret !== process.env.CRON_SECRET) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  let racesInserted = 0, runnersInserted = 0;
  const errors = [];
  for (const day of ['today', 'tomorrow']) {
    try {
      const data = await fetchRacecards(day);
      for (const race of (data.races || [])) {
        await supabase.from('races').upsert({
          race_id: race.race_id, course: race.course, race_name: race.race_name,
          race_type: race.type, going: race.going,
          distance_furlongs: parseFloat(race.dist_f) || null,
          off_time: race.off_time, field_size: (race.runners || []).length, race_date: race.date,
        }, { onConflict: 'race_id' });
        racesInserted++;
        for (const runner of (race.runners || [])) {
          await supabase.from('runners').upsert({
            runner_id: race.race_id + '_' + runner.horse_id,
            race_id: race.race_id,
            horse_name: runner.horse + ' (' + (runner.region || 'GB') + ')',
            horse_id: runner.horse_id, jockey: runner.jockey, trainer: runner.trainer,
            age: parseInt(runner.age) || null, draw: parseInt(runner.draw) || null,
            form: runner.form, rpr: parseInt(runner.rpr) || null,
            race_type: race.type, race_date: race.date, odds_raw: runner,
          }, { onConflict: 'runner_id' });
          runnersInserted++;
        }
      }
    } catch (e) { errors.push(day + ': ' + e.message); }
  }
  return NextResponse.json({ ok: true, racesInserted, runnersInserted, errors });
}