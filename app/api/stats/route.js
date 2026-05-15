import { NextResponse } from 'next/server';
import supabase from '../../../lib/supabase.js';

export async function GET() {
  const today = new Date().toISOString().split('T')[0];
  const { data: season, error: seasonErr } = await supabase.from('persona_season').select('*');
  if (seasonErr) return NextResponse.json({ error: seasonErr.message }, { status: 500 });

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const fromDate = thirtyDaysAgo.toISOString().split('T')[0];

  const { data: picks, error: picksErr } = await supabase.from('persona_picks').select('*')
    .lt('race_date', today)
    .gte('race_date', fromDate)
    .order('race_date', { ascending: false })
    .order('is_best_pick', { ascending: false });
  if (picksErr) return NextResponse.json({ error: picksErr.message }, { status: 500 });

  return NextResponse.json({ season: season || [], picks: picks || [] });
}
