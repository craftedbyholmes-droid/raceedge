import { NextResponse } from 'next/server';
import supabase from '@/lib/supabase';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const plan = searchParams.get('plan') || 'free';

  const { data } = await supabase
    .from('cache').select('value, updated_at').eq('key', 'races_today').single();

  const races = (data?.value || []).map(race => {
    const runners = race.runners || [];
    return Object.assign({}, race, {
      // free gets top 1 runner, pro/edge get top 2
      runners: plan === 'free' ? runners.slice(0, 1) : runners.slice(0, 2),
    });
  });

  const res = NextResponse.json({ races, cached_at: data?.updated_at || null });

  // Cache for 5 minutes in browser, 10 minutes on CDN
  res.headers.set('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=300');
  return res;
}
