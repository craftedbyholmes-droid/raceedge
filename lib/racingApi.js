const BASE = 'https://api.theracingapi.com/v1';
const auth = () => 'Basic ' + Buffer.from(
  process.env.RACING_API_USER + ':' + process.env.RACING_API_PASS
).toString('base64');

// Known non-UK/IRE venues to exclude
const EXCLUDE_COURSES = [
  'Churchill Downs','Pimlico','Belmont','Aqueduct','Gulfstream',
  'Santa Anita','Keeneland','Del Mar','Saratoga','Monmouth',
  'Palermo','Flemington','Randwick','Caulfield','Moonee Valley',
  'Sha Tin','Happy Valley','Meydan','Nad Al Sheba',
  'Chantilly','Longchamp','Deauville','Saint-Cloud','Maisons-Laffitte',
  'Baden-Baden','Hamburg','Cologne','Rome','Milan','Tokyo','Nakayama'
];

const UK_IRE_REGIONS = ['GB', 'IRE'];

function isUKIRE(race) {
  if (!UK_IRE_REGIONS.includes(race.region)) return false;
  if (EXCLUDE_COURSES.some(c => (race.course || '').includes(c))) return false;
  return true;
}

export async function fetchRacecards(day = 'today') {
  const res = await fetch(BASE + '/racecards/standard?day=' + day, {
    headers: { Authorization: auth() }, next: { revalidate: 0 }
  });
  if (!res.ok) throw new Error('RacingAPI ' + res.status + ': ' + await res.text());
  const data = await res.json();
  const all = data.racecards || [];
  return { racecards: all.filter(isUKIRE) };
}

export async function fetchResults(date) {
  const res = await fetch(BASE + '/results?date=' + date, {
    headers: { Authorization: auth() }, next: { revalidate: 0 }
  });
  if (!res.ok) throw new Error('RacingAPI results ' + res.status);
  const data = await res.json();
  const all = data.results || data.races || [];
  return { races: all.filter(isUKIRE) };
}
