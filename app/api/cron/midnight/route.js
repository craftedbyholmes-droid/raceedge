import { NextResponse } from 'next/server';

// Midnight: fetch -> score -> cache -> picks in order
// Mistake #7: order must never be swapped

function checkSecret(request) {
  const auth = request.headers.get('authorization') || '';
  return auth === 'Bearer ' + process.env.CRON_SECRET;
}

async function callStep(path) {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const res = await fetch(base + path, {
    headers: { Authorization: 'Bearer ' + process.env.CRON_SECRET },
    cache: 'no-store',
  });
  const data = await res.json().catch(function() { return {}; });
  return { path: path, status: res.status, ok: res.ok, data: data };
}

export async function GET(request) {
  if (!checkSecret(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const steps = [];
  const fetch = await callStep('/api/cron');
  steps.push(fetch);
  if (!fetch.ok) return NextResponse.json({ success: false, steps: steps, error: 'Fetch step failed' });

  const score = await callStep('/api/cron/score');
  steps.push(score);
  if (!score.ok) return NextResponse.json({ success: false, steps: steps, error: 'Score step failed' });

  const cache = await callStep('/api/cron/cache');
  steps.push(cache);
  if (!cache.ok) return NextResponse.json({ success: false, steps: steps, error: 'Cache step failed' });

  const personas = await callStep('/api/personas');
  steps.push(personas);

  return NextResponse.json({ success: steps.every(function(s) { return s.ok; }), steps: steps, timestamp: new Date().toISOString() });
}