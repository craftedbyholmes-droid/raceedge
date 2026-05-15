import { NextResponse } from 'next/server';
import supabase from '../../../lib/supabase.js';

export async function GET(request) {
  const today = new Date().toISOString().split('T')[0];
  const url = new URL(request.url);
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  const limit = parseInt(url.searchParams.get('limit') || '200', 10);

  let query = supabase.from('scores')
    .select('runner_id, race_id, race_date, total, scores, runners(horse_name, jockey, trainer, course, race_type, off_time, field_size, odds_raw)')
    .lt('race_date', today)
    .gte('total', 60)
    .order('race_date', { ascending: false })
    .order('total', { ascending: false })
    .limit(limit);

  if (from) query = query.gte('race_date', from);
  if (to) query = query.lte('race_date', to);

  const { data: selections, error: selErr } = await query;
  if (selErr) return NextResponse.json({ error: selErr.message }, { status: 500 });
  if (!selections || selections.length === 0) return NextResponse.json({ selections: [] });

  const raceIds = Array.from(new Set(selections.map(function(s) { return s.race_id; })));
  const { data: results } = await supabase.from('results')
    .select('horse_name, race_date, race_id, position, sp_decimal, field_size')
    .in('race_id', raceIds);

  const resultMap = {};
  for (const r of (results || [])) { resultMap[r.horse_name + '_' + r.race_date] = r; }

  const merged = selections.map(function(sel) {
    const runner = sel.runners;
    const result = resultMap[(runner ? runner.horse_name : '') + '_' + sel.race_date] || null;
    return {
      runner_id: sel.runner_id, race_id: sel.race_id, race_date: sel.race_date, total: sel.total,
      horse_name: runner ? runner.horse_name : null, jockey: runner ? runner.jockey : null,
      trainer: runner ? runner.trainer : null, course: runner ? runner.course : null,
      race_type: runner ? runner.race_type : null, off_time: runner ? runner.off_time : null,
      field_size: runner ? runner.field_size : null,
      position: result ? result.position : null, sp_decimal: result ? result.sp_decimal : null,
      result_field_size: result ? result.field_size : null,
    };
  });

  return NextResponse.json({ selections: merged });
}
