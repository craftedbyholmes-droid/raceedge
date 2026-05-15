const BASE_URL = 'https://api.theracingapi.com/v1';

function getAuthHeader() {
  const credentials = process.env.RACING_API_USER + ':' + process.env.RACING_API_PASS;
  return 'Basic ' + Buffer.from(credentials).toString('base64');
}

// UK/IRE filter - applied at source so foreign races never enter the DB
// Mistake #4: was not implemented until days into the previous build
export function isUKorIRE(region) {
  if (!region) return false;
  const r = region.toLowerCase();
  return r === 'gb' || r === 'ire';
}

// Horse name always includes country code - both runners and results tables
// Mistake #18: format was not applied consistently
export function formatHorseName(horse, region) {
  return horse + ' (' + (region ? region.toUpperCase() : 'GB') + ')';
}

// Fetch racecards for today or tomorrow
// Mistake #5: previous build used data.races - correct key is data.racecards
export async function fetchRacecards(day) {
  if (!day) day = 'today';
  const url = BASE_URL + '/racecards/standard?day=' + day;
  const res = await fetch(url, {
    headers: { Authorization: getAuthHeader() },
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error('RacingAPI racecards error: ' + res.status + ' ' + res.statusText);
  }
  const data = await res.json();

  // Correct key is data.racecards - NOT data.races
  const racecards = data.racecards || [];

  // Filter to UK and Ireland only - at source
  const filtered = racecards.filter(function(race) {
    return isUKorIRE(race.region || race.course_region);
  });

  return filtered.map(function(race) {
    return {
      race_id: race.race_id,
      course: race.course,
      race_name: race.race_name,
      race_type: race.type,
      going: race.going,
      distance_furlongs: race.dist_f,
      off_time: race.off_time,
      field_size: (race.runners || []).length,
      race_date: race.date,
      region: race.region || race.course_region,
      runners: (race.runners || []).map(function(runner) {
        return {
          runner_id: race.race_id + '_' + runner.horse_id,
          race_id: race.race_id,
          horse_name: formatHorseName(runner.horse, runner.region),
          horse_id: runner.horse_id,
          jockey: runner.jockey,
          trainer: runner.trainer,
          age: runner.age,
          draw: runner.draw,
          form: runner.form,
          rpr: runner.rpr,
          race_type: race.type,
          race_date: race.date,
          odds_raw: runner,
        };
      }),
    };
  });
}

// Fetch results for a given date
// Mistake #16: previous build used data.races - correct key is data.results
// Mistake #18: date param was ignored, always defaulted to yesterday
export async function fetchResults(date) {
  if (!date) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    date = yesterday.toISOString().split('T')[0];
  }
  const url = BASE_URL + '/results?date=' + date;
  const res = await fetch(url, {
    headers: { Authorization: getAuthHeader() },
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error('RacingAPI results error: ' + res.status + ' ' + res.statusText);
  }
  const data = await res.json();

  // Correct key is data.results - NOT data.races
  const results = data.results || [];

  // Filter to UK and Ireland only
  const filtered = results.filter(function(race) {
    return isUKorIRE(race.region || race.course_region);
  });

  const rows = [];
  for (const race of filtered) {
    const runners = race.runners || [];
    for (const runner of runners) {
      const pos = runner.position;
      rows.push({
        result_id: race.race_id + '_' + runner.horse_id,
        race_id: race.race_id,
        course: race.course,
        race_date: date,
        horse_name: formatHorseName(runner.horse, runner.region),
        horse_id: runner.horse_id,
        position: (pos === 'NR' || pos === null || pos === undefined)
          ? null
          : (parseInt(pos, 10) || null),
        sp_decimal: runner.sp_dec ? parseFloat(runner.sp_dec) : null,
        field_size: runners.length,
      });
    }
  }
  return rows;
}