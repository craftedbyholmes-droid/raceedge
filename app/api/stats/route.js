import { NextResponse } from 'next/server';
import supabase from '@/lib/supabase';

export async function GET() {
  const { data: season }     = await supabase.from('persona_season').select('*');
  const { data: allPicks }   = await supabase.from('persona_picks').select('*').order('race_date', { ascending: false });
  const today = new Date().toISOString().split('T')[0];
  const { data: todayPicks } = await supabase.from('persona_picks').select('*').eq('race_date', today);

  const seasonMap = {}, picksMap = { AJ: [], TC: [] }, todayMap = { AJ: [], TC: [] };
  for (const s of (season || []))     seasonMap[s.persona] = s;
  for (const p of (allPicks || []))   if (picksMap[p.persona])  picksMap[p.persona].push(p);
  for (const p of (todayPicks || [])) if (todayMap[p.persona])  todayMap[p.persona].push(p);

  const res = NextResponse.json({ season: seasonMap, picks: picksMap, today: todayMap });
  res.headers.set('Cache-Control', 'public, s-maxage=1800, stale-while-revalidate=300');
  return res;
}
