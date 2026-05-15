import { NextResponse } from 'next/server';
import supabase from '../../../../lib/supabase.js';
import { scoreRunner } from '../../../../lib/scorer.js';

// Must run AFTER /api/cron fetch and BEFORE /api/cron/cache
// Mistake #7: cache was previously built before scoring - scores showed as 0

function checkSecret(request) {
  const auth = request.headers.get('authorization') || '';
  return auth === 'Bearer ' + process.env.CRON_SECRET;
}

export async function GET(request) {
  if (!checkSecret(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const today = new Date().toISOString().split('T')[0];
  const tom = new Date(); tom.setDate(tom.getDate() + 1);
  const tomorrow = tom.toISOString().split('T')[0];

  const { data: runners, error: fetchErr } = await supabase
    .from('runners')
    .select('runner_id, race_id, race_date, race_type, odds_raw, form, rpr, age, draw, trainer, jockey')
    .in('race_date', [today, tomorrow]);

  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  if (!runners || runners.length === 0) return NextResponse.json({ success: true, scored: 0, message: 'No runners found' });

  const errors = [];
  const scoreRows = [];

  for (const runner of runners) {
    try {
      const result = scoreRunner(runner.odds_raw || runner, runner.race_type);
      scoreRows.push({
        runner_id: runner.runner_id,
        race_id: runner.race_id,
        race_date: runner.race_date,
        scores: result.scores,
        total: result.total,
      });
    } catch (err) { errors.push('Score runner ' + runner.runner_id + ': ' + err.message); }
  }

  let scored = 0;
  const BATCH = 50;
  for (let i = 0; i < scoreRows.length; i += BATCH) {
    const { error: upsertErr } = await supabase.from('scores').upsert(scoreRows.slice(i, i + BATCH), { onConflict: 'runner_id' });
    if (upsertErr) errors.push('Scores batch ' + i + ': ' + upsertErr.message);
    else scored += Math.min(BATCH, scoreRows.length - i);
  }

  return NextResponse.json({ success: errors.length === 0, scored, errors, timestamp: new Date().toISOString() });
}