import { NextResponse } from 'next/server';
import supabase from '@/lib/supabase';

export async function GET() {
  const { data } = await supabase
    .from('cache').select('value').eq('key', 'ticker').single();
  const res = NextResponse.json({ items: data?.value || [] });
  res.headers.set('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=300');
  return res;
}
