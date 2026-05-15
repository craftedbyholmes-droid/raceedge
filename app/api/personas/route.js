import { NextResponse } from 'next/server';
import supabase from '../../../lib/supabase.js';
import { PERSONAS, selectPicks, generateTipText } from '../../../lib/personas.js';

function checkSecret(request) {
  const auth = request.headers.get('authorization') || '';
  return auth === 'Bearer ' + process.env.CRON_SECRET;
}

export async function GET(request) {
  if (!checkSecret(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const today = new Date().toISOString().split('T')[0];
  const results = {};
  const errors = [];

  for (const personaId in PERSONAS) {
    const persona = PERSONAS[personaId];
    try {
      const picks = await selectPicks(today, personaId);
      results[personaId] = { picks: picks.length };
      if (picks.length === 0) continue;
      for (const pick of picks) {
        let tipText = '';
        try { tipText = await generateTipText(pick, persona); }
        catch (tipErr) { errors.push('Tip text ' + personaId + ': ' + tipErr.message); }
        const pickId = personaId + '_' + pick.race_id + '_' + pick.runner_id + '_' + today;
        const { error: upsertErr } = await supabase.from('persona_picks').upsert({
          pick_id: pickId, persona: personaId, horse_name: pick.horse_name,
          race_id: pick.race_id, course: pick.course, race_type: pick.race_type,
          race_date: today, score: pick.score, score_gap: pick.score_gap,
          is_best_pick: pick.is_best_pick, tip_text: tipText, odds: pick.odds,
        }, { onConflict: 'pick_id' });
        if (upsertErr) errors.push('Pick upsert ' + pickId + ': ' + upsertErr.message);
      }
    } catch (err) { errors.push('Persona ' + personaId + ': ' + err.message); }
  }

  return NextResponse.json({ success: errors.length === 0, date: today, results: results, errors: errors, timestamp: new Date().toISOString() });
}
