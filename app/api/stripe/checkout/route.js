import { NextResponse } from 'next/server';
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PRICE_IDS = {
  pro:     process.env.STRIPE_PRO_PRICE_ID,
  edge:    process.env.STRIPE_EDGE_PRICE_ID,
  daypass: process.env.STRIPE_DAYPASS_PRICE_ID,
};

export async function POST(req) {
  const { plan } = await req.json();
  const priceId  = PRICE_IDS[plan];
  if (!priceId) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });

  const isDayPass = plan === 'daypass';

  const session = await stripe.checkout.sessions.create({
    mode: isDayPass ? 'payment' : 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: process.env.NEXT_PUBLIC_SITE_URL + '/account?success=1',
    cancel_url:  process.env.NEXT_PUBLIC_SITE_URL + '/pricing',
    metadata: { plan: isDayPass ? 'edge' : plan, is_daypass: isDayPass ? 'true' : 'false' },
  });

  return NextResponse.json({ url: session.url });
}
