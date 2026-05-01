import { NextResponse } from 'next/server';
import supabase from '@/lib/supabase';
import { scoreRunner } from '@/lib/scorer';

export async function GET(req) {
  const secret = req.headers.get('authorization')?.replace('Bearer ', '');
  if (secret !== process.env.CRON_SECRET) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const today    = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const { data: runners } = await supabase.from('runners').select('*').in('race_date', [today, tomorrow]);
  let scored = 0;
  for (const runner of (runners || [])) {
    const { scores, total } = scoreRunner(runner, { race_type: runner.race_type });
    await supabase.from('scores').upsert({
      runner_id: runner.runner_id, race_id: runner.race_id,
      race_date: runner.race_date, scores, total,
    }, { onConflict: 'runner_id' });
    scored++;
  }
  return NextResponse.json({ ok: true, scored });
}