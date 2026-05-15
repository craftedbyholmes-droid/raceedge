import { NextResponse } from 'next/server';
import supabase from '../../../lib/supabase.js';

export async function GET() {
  const { data, error } = await supabase.from('cache').select('value, updated_at').eq('key', 'races_today').single();
  if (error || !data) return NextResponse.json({ races: [], message: 'No cache available' });
  return NextResponse.json({ races: data.value || [], updated_at: data.updated_at });
}
