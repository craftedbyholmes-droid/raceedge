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
        const isNR   = !posRaw || posRaw === 'NR' || posRaw === 'nr';
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

    // After inserting results settle any unsettled picks
    const base = process.env.NEXT_PUBLIC_SITE_URL || '';
    if (base) {
      await fetch(base + '/api/personas/settle', {
        headers: { Authorization: 'Bearer ' + process.env.CRON_SECRET }
      }).catch(() => {});
    }

    // Refresh ticker cache
    const today = new Date().toISOString().split('T')[0];
    const { data: picks } = await supabase
      .from('persona_picks').select('*')
      .not('position', 'is', null)
      .order('race_date', { ascending: false }).limit(40);
    const personas = { AJ: 'Robbie', TC: 'Pat' };
    const items = (picks || []).map(p => {
      const terms = (p.field_size || 0) >= 8 ? 3 : 2;
      let cls = 't-loss', result = 'Unplaced';
      if (p.is_nr)               { cls = 't-nr';   result = 'N/R'; }
      else if (p.position === 1) { cls = 't-win';  result = 'WON'; }
      else if (p.position && p.position <= terms) {
        cls = 't-place';
        result = p.position + (['','st','nd','rd'][p.position] || 'th');
      }
      return {
        persona: personas[p.persona] || p.persona,
        horse:   (p.horse_name || '').split(' (')[0],
        course:  p.course,
        cls, result,
      };
    });
    await supabase.from('cache').upsert({
      key: 'ticker', value: items, date: today, updated_at: new Date().toISOString(),
    }, { onConflict: 'key' });

    return NextResponse.json({ ok: true, date: targetDate, inserted });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message });
  }
}
