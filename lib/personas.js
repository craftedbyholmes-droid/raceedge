export const PERSONAS = {
  AJ: {
    id: 'AJ', name: 'Rambling Robbie', colour: '#a3e635',
    raceTypes: ['Chase', 'Hurdle'], avatar: 'AJ',
    bio: "Jumps specialist with 30 years trackside at Cheltenham. Knows every trainer's prep routine."
  },
  TC: {
    id: 'TC', name: 'Punter Pat', colour: '#4d9fff',
    raceTypes: ['Flat'], avatar: 'TC',
    bio: 'Grew up near Newmarket. Stats-driven flat expert with an eye for horses moving through the weights.'
  }
};

export const STAKE = { win: 5, ew: 5, total: 10 };

export function calcPnL(picks) {
  let staked = 0, returned = 0;
  for (const p of picks) {
    if (p.is_nr) continue;
    staked += STAKE.total;
    const sp = parseFloat(p.sp_decimal) || 0;
    const terms = p.field_size >= 8 ? 3 : 2;
    if (p.position === 1) {
      returned += STAKE.win * sp;
      returned += STAKE.ew * (sp - 1) / 4 + STAKE.ew;
    } else if (p.position && p.position <= terms) {
      returned += STAKE.ew * (sp - 1) / 4 + STAKE.ew;
    }
  }
  return { staked, returned, profit: returned - staked };
}

export function selectPicks(scoredRunners, personaId) {
  const p = PERSONAS[personaId];
  const byRace = {};
  for (const r of scoredRunners) {
    if (!p.raceTypes.includes(r.race_type)) continue;
    if (!byRace[r.race_id]) byRace[r.race_id] = [];
    byRace[r.race_id].push(r);
  }
  const picks = [];
  for (const raceId of Object.keys(byRace)) {
    const sorted = byRace[raceId].sort((a, b) => b.total - a.total);
    const top = sorted[0];
    const second = sorted[1];
    const gap = second ? top.total - second.total : 99;
    if (top.total >= 72 || gap >= 8) {
      picks.push(Object.assign({}, top, { score_gap: gap, race_id: raceId }));
    }
  }
  return picks.sort((a, b) => b.total - a.total).slice(0, 1);
}