import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import supabase from '@/lib/supabase';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

async function getCallerEmail(req) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return null;
  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const { data: { user } } = await anonClient.auth.getUser(token);
  return user?.email || null;
}

// GET - list all gifted access
export async function GET(req) {
  const email = await getCallerEmail(req);
  if (email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { data } = await supabase
    .from('gifted_access')
    .select('*')
    .order('created_at', { ascending: false });
  return NextResponse.json({ gifted: data || [] });
}

// POST - grant access { email, plan, expires_at (optional) }
export async function POST(req) {
  const email = await getCallerEmail(req);
  if (email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { email: giftEmail, plan, expires_at } = await req.json();
  if (!giftEmail || !plan) {
    return NextResponse.json({ error: 'email and plan required' }, { status: 400 });
  }
  const { error } = await supabase.from('gifted_access').upsert({
    email: giftEmail.toLowerCase().trim(),
    plan,
    expires_at: expires_at || null,
    created_at: new Date().toISOString(),
    granted_by: ADMIN_EMAIL,
  }, { onConflict: 'email' });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, email: giftEmail, plan });
}

// DELETE - revoke access { email }
export async function DELETE(req) {
  const email = await getCallerEmail(req);
  if (email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { email: giftEmail } = await req.json();
  await supabase.from('gifted_access').delete().eq('email', giftEmail.toLowerCase().trim());
  return NextResponse.json({ ok: true });
}
