import { NextResponse } from 'next/server';
import supabase from '@/lib/supabase';
export async function GET() {
  const today = new Date().toISOString().split('T')[0];
  const { data } = await supabase.from('persona_picks').select('*').eq('race_date', today);
  const grouped = { AJ: [], TC: [] };
  for (const p of (data || [])) { if (grouped[p.persona]) grouped[p.persona].push(p); }
  return NextResponse.json(grouped);
}