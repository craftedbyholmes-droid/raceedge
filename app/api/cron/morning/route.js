import { NextResponse } from 'next/server';
import supabase from '@/lib/supabase';
import { fetchRacecards, fetchResults } from '@/lib/racingApi';
import { scoreRunner } from '@/lib/scorer';
import { PERSONAS, selectPicks } from '@/lib/personas';
import { bestOdds } from '@/lib/odds';
import Anthropic from '@anthropic-ai/sdk';

const ai = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function genTip(runner, persona) {
  try {
    const msg = await ai.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 80,
      messages: [{ role: 'user', content: 'You are ' + persona.name + ', a UK horse racing tipster. Write ONE punchy sentence (max 18 words) explaining why ' + runner.horse_name + ' is your pick at ' + runner.course + ' today.' }],
    });
    return msg.content[0]?.text?.trim() || '';
  } catch (e) { return ''; }
}

export async function GET() {
  const today     = new Date().toISOString().split('T')[0];
  const tomorrow  = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const log = [];

  // STEP 1: Fetch racecards
  let racesIn = 0, runnersIn = 0;
  for (const day of ['today', 'tomorrow']) {
    try {
      const data = await fetchRacecards(day);
      for (const race of (data.racecards || [])) {
        await supabase.from('races').upsert({
          race_id:           race.race_id,
          course:            race.course,
          race_name:         race.race_name,
          race_type:         race.type,
          going:             race.going,
          distance_furlongs: parseFloat(race.dist_f) || null,
          off_time:          race.off_time,
          field_size:        (race.runners || []).length,
          race_date:         race.date,
        }, { onConflict: 'race_id' });
        racesIn++;
        for (const runner of (race.runners || [])) {
          await supabase.from('runners').upsert({
            runner_id:  race.race_id + '_' + runner.horse_id,
            race_id:    race.race_id,
            horse_name: runner.horse + ' (' + (runner.region || 'GB') + ')',
            horse_id:   runner.horse_id,
            jockey:     runner.jockey,
            trainer:    runner.trainer,
            age:        parseInt(runner.age)  || null,
            draw:       parseInt(runner.draw) || null,
            form:       runner.form,
            rpr:        parseInt(runner.rpr)  || null,
            race_type:  race.type,
            race_date:  race.date,
            odds_raw:   runner,
          }, { onConflict: 'runner_id' });
          runnersIn++;
        }
      }
    } catch (e) { log.push('fetch ' + day + ': ' + e.message); }
  }
  log.push('fetched ' + racesIn + ' races, ' + runnersIn + ' runners');

  // STEP 2: Score runners
  const { data: runners } = await supabase
    .from('runners').select('*').in('race_date', [today, tomorrow]);
  for (const runner of (runners || [])) {
    const { scores, total } = scoreRunner(runner, { race_type: runner.race_type });
    await supabase.from('scores').upsert({
      runner_id: runner.runner_id,
      race_id:   runner.race_id,
      race_date: runner.race_date,
      scores, total,
    }, { onConflict: 'runner_id' });
  }
  log.push('scored ' + (runners || []).length + ' runners');

  // STEP 3: Build cache
  for (const [key, date] of [['races_today', today], ['races_tomorrow', tomorrow]]) {
    const { data: races } = await supabase
      .from('races').select('*').eq('race_date', date).order('off_time');
    const built = [];
    for (const race of (races || [])) {
      const { data: rr } = await supabase
        .from('runners').select('*, scores(total)')
        .eq('race_id', race.race_id).limit(30);
      const sorted = (rr || [])
        .map(r => {
          const o = bestOdds(r.odds_raw?.odds || []);
          return Object.assign({}, r, {
            total:           r.scores?.total || 0,
            best_fractional: o.fractional,
            best_decimal:    o.decimal,
            best_bookmaker:  o.bookmaker,
          });
        })
        .sort((a, b) => b.total - a.total)
        .slice(0, 2);
      built.push(Object.assign({}, race, { runners: sorted }));
    }
    await supabase.from('cache').upsert({
      key, value: built, date, updated_at: new Date().toISOString(),
    }, { onConflict: 'key' });
  }
  log.push('cache built');

  // STEP 4: Generate picks
  const { data: allRunners } = await supabase
    .from('runners').select('*, scores(total)').eq('race_date', today);
  const enriched = (allRunners || []).map(r =>
    Object.assign({}, r, { total: r.scores?.total || 0 })
  );
  const topPicks = {};
  for (const id of Object.keys(PERSONAS)) {
    const persona = PERSONAS[id];
    for (const pick of selectPicks(enriched, id)) {
      const tipText = await genTip(pick, persona);
      const pickOdds = bestOdds(pick.odds_raw?.odds || []);
      await supabase.from('persona_picks').upsert({
        pick_id:      id + '_' + pick.race_id + '_' + pick.runner_id + '_' + today,
        persona:      id,
        horse_name:   pick.horse_name,
        race_id:      pick.race_id,
        course:       pick.course,
        race_type:    pick.race_type,
        race_date:    today,
        score:        pick.total,
        score_gap:    pick.score_gap,
        is_best_pick: true,
        tip_text:     tipText,
        odds:         pickOdds.fractional || 'N/A',
      }, { onConflict: 'pick_id' });
      topPicks[id] = { horse_name: pick.horse_name, course: pick.course, race_type: pick.race_type, score: pick.total, odds: pickOdds.fractional || 'N/A', tip_text: tipText };
    }
  }
  const allTop = Object.values(topPicks);
  if (allTop.length) {
    const free = allTop.sort((a, b) => b.score - a.score)[0];
    await supabase.from('cache').upsert({
      key: 'free_tip_today', value: free, date: today, updated_at: new Date().toISOString(),
    }, { onConflict: 'key' });
  }
  log.push('picks generated: ' + Object.keys(topPicks).length);

  // STEP 5: Fetch yesterday results and settle
  try {
    const results = await fetchResults(yesterday);
    let inserted = 0;
    for (const race of (results.races || [])) {
      for (const runner of (race.runners || [])) {
        const posRaw = runner.position;
        const isNR   = !posRaw || posRaw === 'NR' || posRaw === 'nr';
        await supabase.from('results').upsert({
          result_id:  race.race_id + '_' + runner.horse_id,
          race_id:    race.race_id,
          course:     race.course,
          race_date:  yesterday,
          horse_name: runner.horse + ' (' + (runner.region || 'GB') + ')',
          horse_id:   runner.horse_id,
          position:   isNR ? null : parseInt(posRaw) || null,
          sp_decimal: parseFloat(runner.sp_dec) || null,
          field_size: (race.runners || []).length,
        }, { onConflict: 'result_id' });
        inserted++;
      }
    }
    log.push('yesterday results: ' + inserted);
  } catch (e) { log.push('results error: ' + e.message); }

  return NextResponse.json({ ok: true, date: today, log });
}
