const BASE = 'https://api.theracingapi.com/v1';
const auth = () => 'Basic ' + Buffer.from(
  process.env.RACING_API_USER + ':' + process.env.RACING_API_PASS
).toString('base64');

const UK_IRE_REGIONS = ['GB', 'IRE'];

export async function fetchRacecards(day = 'today') {
  const res = await fetch(BASE + '/racecards/standard?day=' + day, {
    headers: { Authorization: auth() }, next: { revalidate: 0 }
  });
  if (!res.ok) throw new Error('RacingAPI ' + res.status + ': ' + await res.text());
  const data = await res.json();
  const all = data.racecards || [];
  const filtered = all.filter(r => UK_IRE_REGIONS.includes(r.region));
  return { racecards: filtered };
}

export async function fetchResults(date) {
  const res = await fetch(BASE + '/results?date=' + date, {
    headers: { Authorization: auth() }, next: { revalidate: 0 }
  });
  if (!res.ok) throw new Error('RacingAPI results ' + res.status);
  const data = await res.json();
  const all = data.results || data.races || [];
  const filtered = all.filter(r => UK_IRE_REGIONS.includes(r.region));
  return { races: filtered };
}
