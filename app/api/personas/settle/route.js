import { NextResponse } from 'next/server';
import supabase from '@/lib/supabase';

export async function GET() {
  const today = new Date().toISOString().split('T')[0];
  const { data: picks } = await supabase
    .from('persona_picks').select('*')
    .eq('race_date', today)
    .eq('is_nr', false)
    .is('position', null);

  for (const pick of (picks || [])) {
    const { data: raceRes } = await supabase
      .from('results').select('race_id').eq('race_id', pick.race_id).limit(1);
    const { data: horseRes } = await supabase
      .from('results').select('*')
      .eq('horse_name', pick.horse_name).eq('race_date', today);

    if (raceRes?.length && (!horseRes || !horseRes.length)) {
      await supabase.from('persona_picks')
        .update({ is_nr: true }).eq('pick_id', pick.pick_id);
      continue;
    }
    if (horseRes?.[0]) {
      const r = horseRes[0];
      await supabase.from('persona_picks').update({
        position:   r.position,
        sp_decimal: r.sp_decimal,
        field_size: r.field_size,
      }).eq('pick_id', pick.pick_id);

      if (!r.position) continue;
      const sp     = parseFloat(r.sp_decimal) || 0;
      const terms  = (r.field_size || 0) >= 8 ? 3 : 2;
      const placed = r.position <= terms;
      let returned = 0;
      if (r.position === 1)  { returned = 5 * sp + 5 * (sp - 1) / 4 + 5; }
      else if (placed)       { returned = 5 * (sp - 1) / 4 + 5; }

      await supabase.rpc('settle_persona', {
        p_persona:  pick.persona,
        p_staked:   10,
        p_returned: returned,
        p_won:      r.position === 1 ? 1 : 0,
        p_placed:   placed && r.position !== 1 ? 1 : 0,
      });
    }
  }
  return NextResponse.json({ ok: true });
}
