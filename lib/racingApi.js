const BASE = 'https://api.theracingapi.com/v1';
const auth = () => 'Basic ' + Buffer.from(
  process.env.RACING_API_USER + ':' + process.env.RACING_API_PASS
).toString('base64');

const EXCLUDE = [
  'Churchill Downs','Pimlico','Belmont','Aqueduct','Gulfstream','Santa Anita',
  'Keeneland','Del Mar','Saratoga','Monmouth','Woodbine','Turfway','Fair Grounds',
  'Palermo','Flemington','Randwick','Caulfield','Moonee Valley','Rosehill',
  'Sha Tin','Happy Valley','Meydan','Nad Al Sheba','Abu Dhabi',
  'Chantilly','Longchamp','Deauville','Saint-Cloud','Maisons-Laffitte','Vichy',
  'Baden-Baden','Hamburg','Cologne','Dortmund','Munich',
  'Rome','Milan','San Siro','Capannelle',
  'Tokyo','Nakayama','Hanshin','Kyoto','Sapporo','Niigata',
  'Seoul','Singapore','Kranji'
];

function isUKIRE(race) {
  const c = (race.course || '').trim().toLowerCase();
  return !EXCLUDE.some(ex => c.includes(ex.toLowerCase()));
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
