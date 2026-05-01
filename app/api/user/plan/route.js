import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import supabase from '@/lib/supabase';

// Permanent edge access - never needs a subscription
const PERMANENT_EDGE = [
  'kcholmes2012@gmail.com',
];

export async function GET(req) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ plan: 'free' });

    const anonClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    const { data: { user } } = await anonClient.auth.getUser(token);
    if (!user) return NextResponse.json({ plan: 'free' });

    // Check permanent edge access list first
    if (PERMANENT_EDGE.includes(user.email)) {
      return NextResponse.json({ plan: 'edge', permanent: true });
    }

    // Check gifted access table
    const { data: gift } = await supabase
      .from('gifted_access')
      .select('plan, expires_at')
      .eq('email', user.email)
      .single();

    if (gift) {
      if (!gift.expires_at || new Date(gift.expires_at) > new Date()) {
        return NextResponse.json({ plan: gift.plan, gifted: true });
      }
    }

    // Check paid subscription
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('plan, expires_at')
      .eq('user_id', user.id)
      .single();

    if (!sub) return NextResponse.json({ plan: 'free' });
    if (sub.expires_at && new Date(sub.expires_at) < new Date()) {
      return NextResponse.json({ plan: 'free' });
    }
    return NextResponse.json({ plan: sub.plan || 'free' });

  } catch (e) {
    return NextResponse.json({ plan: 'free' });
  }
}
