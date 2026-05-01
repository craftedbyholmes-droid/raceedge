import { NextResponse } from 'next/server';
import supabase from '@/lib/supabase';

export async function GET() {
  const today = new Date().toISOString().split('T')[0];
  const { data } = await supabase
    .from('persona_picks').select('*')
    .lt('race_date', today)
    .order('race_date', { ascending: false });

  const res = NextResponse.json({ selections: data || [] });
  res.headers.set('Cache-Control', 'public, s-maxage=1800, stale-while-revalidate=300');
  return res;
}
