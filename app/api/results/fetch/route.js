import { NextResponse } from 'next/server';
import supabase from '@/lib/supabase';
import { fetchResults } from '@/lib/racingApi';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const yesterday  = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const targetDate = searchParams.get('date') || yesterday;

  try {
    const data = await fetchResults(targetDate);
    let inserted = 0;
    for (const race of (data.races || [])) {
      for (const runner of (race.runners || [])) {
        const posRaw = runner.position;
        const isNR   = posRaw === 'NR' || posRaw === 'nr' || !posRaw;
        await supabase.from('results').upsert({
          result_id:  race.race_id + '_' + runner.horse_id,
          race_id:    race.race_id,
          course:     race.course,
          race_date:  targetDate,
          horse_name: runner.horse + ' (' + (runner.region || 'GB') + ')',
          horse_id:   runner.horse_id,
          position:   isNR ? null : parseInt(posRaw) || null,
          sp_decimal: parseFloat(runner.sp_dec) || null,
          field_size: (race.runners || []).length,
        }, { onConflict: 'result_id' });
        inserted++;
      }
    }
    return NextResponse.json({ ok: true, date: targetDate, inserted });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message });
  }
}
