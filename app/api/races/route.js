import { NextResponse } from 'next/server';
import supabase from '@/lib/supabase';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const plan = searchParams.get('plan') || 'free';

  const { data } = await supabase
    .from('cache').select('value, updated_at').eq('key', 'races_today').single();

  const races = (data?.value || []).map(race => {
    const runners = (race.runners || []).slice(0, plan === 'free' ? 1 : 2);
    return Object.assign({}, race, { runners });
  });

  const res = NextResponse.json({ races, cached_at: data?.updated_at });
  res.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60');
  return res;
}
