import { NextResponse } from 'next/server';
import supabase from '../../../lib/supabase.js';

export async function GET() {
  const { data, error } = await supabase.from('cache').select('value, updated_at, date').eq('key', 'races_tomorrow').single();
  if (error || !data) return NextResponse.json({ races: [], message: 'No tomorrow cache available' });
  return NextResponse.json({ races: data.value || [], date: data.date, updated_at: data.updated_at });
}
