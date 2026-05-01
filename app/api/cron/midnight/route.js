import { NextResponse } from 'next/server';
import supabase from '@/lib/supabase';

export async function GET(req) {
  const secret = req.headers.get('authorization')?.replace('Bearer ', '');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Copy tomorrow cache to today at midnight
  const { data: tmrw } = await supabase.from('cache').select('value').eq('key', 'races_tomorrow').single();
  if (tmrw?.value) {
    const today = new Date().toISOString().split('T')[0];
    await supabase.from('cache').upsert({
      key: 'races_today', value: tmrw.value, date: today,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'key' });
  }

  // Clear stale free tip from yesterday
  await supabase.from('cache').delete().eq('key', 'free_tip_today');

  return NextResponse.json({ ok: true, action: 'midnight: tomorrow copied to today, free tip cleared' });
}
