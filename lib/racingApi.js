const BASE = 'https://api.theracingapi.com/v1';
const auth = () => 'Basic ' + Buffer.from(
  process.env.RACING_API_USER + ':' + process.env.RACING_API_PASS
).toString('base64');

function isUKIRE(race) {
  const region = (race.region || '').toLowerCase();
  return region === 'gb' || region === 'ire';
}

export async function fetchRacecards(day = 'today') {
  const res = await fetch(BASE + '/racecards/standard?day=' + day, {
    headers: { Authorization: auth() }, next: { revalidate: 0 }
  });
  if (!res.ok) throw new Error('RacingAPI racecard ' + res.status + ': ' + await res.text());
  const data = await res.json();
  return { racecards: (data.racecards || []).filter(isUKIRE) };
}

export async function fetchResults(date) {
  const res = await fetch(BASE + '/results?date=' + date, {
    headers: { Authorization: auth() }, next: { revalidate: 0 }
  });
  if (!res.ok) throw new Error('RacingAPI results ' + res.status + ': ' + await res.text());
  const data = await res.json();
  return { races: (data.results || data.races || []).filter(isUKIRE) };
}
