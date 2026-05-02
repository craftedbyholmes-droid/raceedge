import { NextResponse } from 'next/server';
import supabase from '@/lib/supabase';
import { bestOdds } from '@/lib/odds';

export async function GET() {
  const today    = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  for (const [key, date] of [['races_today', today], ['races_tomorrow', tomorrow]]) {
    const { data: races } = await supabase
      .from('races').select('*').eq('race_date', date).order('off_time');
    const built = [];
    for (const race of (races || [])) {
      const { data: raceRunners } = await supabase
        .from('runners').select('*, scores(total)')
        .eq('race_id', race.race_id).limit(30);
      const sorted = (raceRunners || [])
        .map(r => {
          // odds_raw is the full runner object - odds array is at odds_raw.odds
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
