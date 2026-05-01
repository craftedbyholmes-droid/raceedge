import { NextResponse } from 'next/server';
import supabase from '@/lib/supabase';
import { PERSONAS, selectPicks } from '@/lib/personas';
import Anthropic from '@anthropic-ai/sdk';

const ai = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function genTip(runner, persona) {
  try {
    const msg = await ai.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 80,
      messages: [{
        role: 'user',
        content: 'You are ' + persona.name + ', a horse racing tipster. Write ONE punchy sentence (max 18 words) explaining why ' + runner.horse_name + ' is your pick at ' + runner.course + ' today. Mention form or trainer if you can. Sound confident.'
      }]
    });
    return msg.content[0]?.text?.trim() || '';
  } catch (e) { return ''; }
}

export async function GET(req) {
  const secret = req.headers.get('authorization')?.replace('Bearer ', '');
  if (secret !== process.env.CRON_SECRET) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const today = new Date().toISOString().split('T')[0];
  const { data: runners } = await supabase.from('runners').select('*, scores(total)').eq('race_date', today);
  const enriched = (runners || []).map(r => Object.assign({}, r, { total: r.scores?.total || 0 }));
  let pickCount = 0;
  for (const id of Object.keys(PERSONAS)) {
    const persona = PERSONAS[id];
    const picks = selectPicks(enriched, id);
    for (const pick of picks) {
      const tipText = await genTip(pick, persona);
      const odds = pick.odds_raw?.odds?.[0]?.fractional || 'N/A';
      await supabase.from('persona_picks').upsert({
        pick_id: id + '_' + pick.race_id + '_' + pick.runner_id + '_' + today,
        persona: id, horse_name: pick.horse_name, race_id: pick.race_id,
        course: pick.course, race_type: pick.race_type, race_date: today,
        score: pick.total, score_gap: pick.score_gap, is_best_pick: true, tip_text: tipText, odds,
      }, { onConflict: 'pick_id' });
      pickCount++;
    }
  }
  return NextResponse.json({ ok: true, picks: pickCount });
}