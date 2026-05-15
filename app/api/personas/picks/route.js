import { NextResponse } from 'next/server';
import supabase from '../../../../lib/supabase.js';

export async function GET() {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase.from('persona_picks').select('*')
    .eq('race_date', today)
    .order('is_best_pick', { ascending: false })
    .order('score', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const byPersona = {};
  for (const pick of (data || [])) {
    if (!byPersona[pick.persona]) byPersona[pick.persona] = [];
    byPersona[pick.persona].push(pick);
  }
  return NextResponse.json({ date: today, picks: byPersona });
}
