import { NextResponse } from 'next/server';
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const PRICES = { pro: process.env.STRIPE_PRO_PRICE_ID, edge: process.env.STRIPE_EDGE_PRICE_ID };
export async function POST(req) {
  const { plan } = await req.json();
  const priceId  = PRICES[plan];
  if (!priceId) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: process.env.NEXT_PUBLIC_SITE_URL + '/account?success=1',
    cancel_url:  process.env.NEXT_PUBLIC_SITE_URL + '/pricing',
  });
  return NextResponse.json({ url: session.url });
}