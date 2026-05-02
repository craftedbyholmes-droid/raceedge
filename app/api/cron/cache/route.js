import { NextResponse } from 'next/server';
import supabase from '@/lib/supabase';
import { bestOdds } from '@/lib/odds';

export async function GET() {
  const today    = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const nowUTC   = new Date();
  const nowBST   = new Date(nowUTC.getTime() + 60 * 60 * 1000); // UTC+1 BST
  const nowTime  = nowBST.getHours() + ':' + String(nowBST.getMinutes()).padStart(2, '0');

  for (const [key, date] of [['races_today', today], ['races_tomorrow', tomorrow]]) {
    const { data: races } = await supabase
      .from('races').select('*').eq('race_date', date).order('off_time');
    const built = [];
    for (const race of (races || [])) {
      // Hide races that have already finished (off_time < now on today)
      if (date === today && race.off_time && race.off_time < nowTime) continue;

      const { data: rr } = await supabase
        .from('runners').select('*, scores(total)')
        .eq('race_id', race.race_id).limit(30);
      const sorted = (rr || [])
        .map(r => {
          const o = bestOdds(r.odds_raw?.odds || []);
          return Object.assign({}, r, {
            total:           r.scores?.total || 0,
            best_fractional: o.fractional,
            best_decimal:    o.decimal,
            best_bookmaker:  o.bookmaker,
          });
        })
        .sort((a, b) => b.total - a.total)
        .slice(0, 2);
      built.push(Object.assign({}, race, { runners: sorted }));
    }
    await supabase.from('cache').upsert({
      key, value: built, date, updated_at: new Date().toISOString(),
    }, { onConflict: 'key' });
  }
  return NextResponse.json({ ok: true });
}
