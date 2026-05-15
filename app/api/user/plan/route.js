import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request) {
  const auth = request.headers.get('authorization') || '';
  const token = auth.replace('Bearer ', '');
  if (!token) return NextResponse.json({ plan: 'free' });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: 'Bearer ' + token } } }
  );

  const userRes = await supabase.auth.getUser();
  if (userRes.error || !userRes.data.user) return NextResponse.json({ plan: 'free' });

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: sub } = await adminClient.from('subscriptions')
    .select('plan, expires_at').eq('user_id', userRes.data.user.id).single();
  if (!sub) return NextResponse.json({ plan: 'free' });
  if (sub.expires_at && new Date(sub.expires_at) < new Date()) return NextResponse.json({ plan: 'free' });
  return NextResponse.json({ plan: sub.plan || 'free' });
}
