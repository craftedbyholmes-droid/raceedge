import { NextResponse } from 'next/server';
import supabase from '@/lib/supabase';

export async function GET() {
  const today = new Date().toISOString().split('T')[0];

  const { data } = await supabase
    .from('cache').select('value, date, updated_at').eq('key', 'free_tip_today').single();

  // Only serve if it was generated today
  if (!data || data.date !== today) {
    const res = NextResponse.json({ tip: null, reason: 'not_yet_generated' });
    res.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60');
    return res;
  }

  const res = NextResponse.json({ tip: data.value, cached_at: data.updated_at });
  // Cache all day - free tip does not change once set at 07:00
  res.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=600');
  return res;
}
