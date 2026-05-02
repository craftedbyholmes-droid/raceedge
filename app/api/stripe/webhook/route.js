import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import supabase from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  const body = await req.text();
  const sig  = req.headers.get('stripe-signature');
  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const custEmail = session.customer_details?.email;
    const plan = session.metadata?.plan || 'pro';
    const isDayPass = session.metadata?.is_daypass === 'true';

    if (custEmail) {
      // Get user id from email
      const { data: users } = await supabase.auth.admin.listUsers();
      const user = (users?.users || []).find(u => u.email === custEmail);
      if (user) {
        let expiresAt = null;
        if (isDayPass) {
          // Expires at midnight tonight
          const midnight = new Date();
          midnight.setHours(23, 59, 59, 999);
          expiresAt = midnight.toISOString();
        }
        await supabase.from('subscriptions').upsert({
          user_id: user.id, plan, expires_at: expiresAt,
          created_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
      }
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object;
    const custEmail = sub.customer_email;
    if (custEmail) {
      const { data: users } = await supabase.auth.admin.listUsers();
      const user = (users?.users || []).find(u => u.email === custEmail);
      if (user) {
        await supabase.from('subscriptions').update({ plan: 'free' }).eq('user_id', user.id);
      }
    }
  }

  return NextResponse.json({ received: true });
}
