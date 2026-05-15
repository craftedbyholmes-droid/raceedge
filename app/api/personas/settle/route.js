import { NextResponse } from 'next/server';
import supabase from '../../../../lib/supabase.js';
import { calcPnL } from '../../../../lib/personas.js';

function checkSecret(request) {
  const auth = request.headers.get('authorization') || '';
  return auth === 'Bearer ' + process.env.CRON_SECRET;
}

export async function GET(request) {
  if (!checkSecret(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const settleDate = yesterday.toISOString().split('T')[0];

  const { data: picks, error: picksErr } = await supabase.from('persona_picks').select('*')
    .eq('race_date', settleDate).is('position', null);
  if (picksErr) return NextResponse.json({ error: picksErr.message }, { status: 500 });
  if (!picks || picks.length === 0) return NextResponse.json({ success: true, settled: 0, message: 'Nothing to settle' });

  const { data: results, error: resErr } = await supabase.from('results').select('*').eq('race_date', settleDate);
  if (resErr) return NextResponse.json({ error: resErr.message }, { status: 500 });

  const resultsByHorse = {};
  for (const r of (results || [])) { resultsByHorse[r.horse_name + '_' + r.race_date] = r; }
  const racesWithResults = new Set((results || []).map(function(r) { return r.race_id; }));

  const errors = [];
  const personaUpdates = {};
  let settled = 0;

  for (const pick of picks) {
    const result = resultsByHorse[pick.horse_name + '_' + pick.race_date];
    const isNR = !result && racesWithResults.has(pick.race_id);
    const pnl = calcPnL(pick, isNR ? 'NR' : result);
    const { error: updateErr } = await supabase.from('persona_picks').update({
      position: isNR ? null : (result ? result.position : null),
      sp_decimal: isNR ? null : (result ? result.sp_decimal : null),
      profit: pnl.profit, is_nr: isNR, settled: true,
    }).eq('pick_id', pick.pick_id);
    if (updateErr) { errors.push('Update ' + pick.pick_id + ': ' + updateErr.message); continue; }
    if (!personaUpdates[pick.persona]) personaUpdates[pick.persona] = { total_staked: 0, total_returned: 0, total_picks: 0, winners: 0, placed: 0 };
    const p = personaUpdates[pick.persona];
    if (!isNR) {
      p.total_staked += pick.is_best_pick ? 20 : 10;
      p.total_returned += pnl.total_return;
      p.total_picks += 1;
      if (result && result.position === 1) p.winners += 1;
      const places = (result && result.field_size >= 8) ? 3 : 2;
      if (result && result.position >= 1 && result.position <= places) p.placed += 1;
    }
    settled++;
  }

  for (const personaId in personaUpdates) {
    const u = personaUpdates[personaId];
    const { data: current } = await supabase.from('persona_season').select('*').eq('persona', personaId).single();
    await supabase.from('persona_season').upsert({
      persona: personaId,
      total_staked: ((current && current.total_staked) || 0) + u.total_staked,
      total_returned: ((current && current.total_returned) || 0) + u.total_returned,
      total_picks: ((current && current.total_picks) || 0) + u.total_picks,
      winners: ((current && current.winners) || 0) + u.winners,
      placed: ((current && current.placed) || 0) + u.placed,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'persona' });
  }

  return NextResponse.json({ success: errors.length === 0, settled: settled, errors: errors, date: settleDate, timestamp: new Date().toISOString() });
}
