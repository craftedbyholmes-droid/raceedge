import { NextResponse } from 'next/server';
import supabase from '../../../../lib/supabase.js';
import { fetchResults } from '../../../../lib/racingApi.js';

function checkSecret(request) {
  const auth = request.headers.get('authorization') || '';
  return auth === 'Bearer ' + process.env.CRON_SECRET;
}

export async function GET(request) {
  if (!checkSecret(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const url = new URL(request.url);
  const dateParam = url.searchParams.get('date');
  let resultRows;
  try { resultRows = await fetchResults(dateParam); }
  catch (err) { return NextResponse.json({ error: err.message }, { status: 500 }); }
  if (resultRows.length === 0) return NextResponse.json({ success: true, rows: 0, message: 'No UK/IRE results found' });
  const { error: upsertErr } = await supabase.from('results').upsert(resultRows, { onConflict: 'result_id' });
  if (upsertErr) return NextResponse.json({ error: upsertErr.message }, { status: 500 });
  return NextResponse.json({ success: true, rows: resultRows.length, date: dateParam || 'yesterday', timestamp: new Date().toISOString() });
}
