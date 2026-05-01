import { NextResponse } from 'next/server';
import supabase from '@/lib/supabase';
import { bestOdds } from '@/lib/odds';

export async function GET(req) {
  const secret = req.headers.get('authorization')?.replace('Bearer ', '');
  if (secret !== process.env.CRON_SECRET) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const today    = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  for (const [key, date] of [['races_today', today], ['races_tomorrow', tomorrow]]) {
    const { data: races } = await supabase.from('races').select('*').eq('race_date', date);
    const built = [];
    for (const race of (races || [])) {
      const { data: runners } = await supabase
        .from('runners').select('*, scores(total)')
        .eq('race_id', race.race_id).limit(10);
      const sorted = (runners || [])
        .map(r => { const o = bestOdds(r.odds_raw?.odds); return Object.assign({}, r, { total: r.scores?.total || 0, best_fractional: o.fractional, best_decimal: o.decimal }); })
        .sort((a, b) => b.total - a.total).slice(0, 2);
      built.push(Object.assign({}, race, { runners: sorted }));
    }
    await supabase.from('cache').upsert({ key, value: built, date, updated_at: new Date().toISOString() }, { onConflict: 'key' });
  }
  return NextResponse.json({ ok: true });
}