import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import supabase from '@/lib/supabase';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
export async function POST(req) {
  const body = await req.text();
  const sig  = req.headers.get('stripe-signature');
  let event;
  try { event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET); }
  catch (e) { return NextResponse.json({ error: e.message }, { status: 400 }); }
  if (event.type === 'checkout.session.completed') {
    const s = event.data.object;
    if (s.metadata?.user_id) {
      await supabase.from('subscriptions').upsert({ user_id: s.metadata.user_id, plan: s.metadata?.plan || 'pro', expires_at: null, created_at: new Date().toISOString() }, { onConflict: 'user_id' });
    }
  }
  if (event.type === 'customer.subscription.deleted') {
    const s = event.data.object;
    if (s.metadata?.user_id) { await supabase.from('subscriptions').update({ plan: 'free' }).eq('user_id', s.metadata.user_id); }
  }
  return NextResponse.json({ received: true });
}