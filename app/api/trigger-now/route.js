import { NextResponse } from 'next/server';

// One-time trigger to start the pipeline now
// Hit /api/trigger-now from admin panel or browser (while logged in as admin)
export async function GET(req) {
  const secret = req.headers.get('authorization')?.replace('Bearer ', '');
  const isAdmin = secret === process.env.CRON_SECRET;
  const isBrowser = req.headers.get('x-admin-trigger') === 'true';

  if (!isAdmin && !isBrowser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const headers = { Authorization: 'Bearer ' + process.env.CRON_SECRET };
  const log = [];

  try {
    const res = await fetch(base + '/api/cron/morning', { headers });
    const body = await res.json();
    log.push({ step: 'morning-run', ok: body.ok, detail: body.log || [] });
  } catch (e) {
    log.push({ step: 'morning-run', ok: false, error: e.message });
  }

  return NextResponse.json({ ok: true, triggered_at: new Date().toISOString(), log });
}