const BASE = 'https://api.theracingapi.com/v1';
const auth = () => 'Basic ' + Buffer.from(
  process.env.RACING_API_USER + ':' + process.env.RACING_API_PASS
).toString('base64');

const EXCLUDE_COURSES = [
  'Churchill Downs','Pimlico','Belmont Park','Aqueduct','Gulfstream',
  'Santa Anita','Keeneland','Del Mar','Saratoga','Monmouth Park',
  'Palermo','Flemington','Randwick','Caulfield','Moonee Valley',
  'Sha Tin','Happy Valley','Meydan','Nad Al Sheba','Chantilly',
  'Longchamp','Deauville','Saint-Cloud','Baden-Baden','Hamburg',
  'Cologne','Rome','Milan','Tokyo','Nakayama','Hanshin','Kyoto',
  'Leopardstown (USA)','Woodbine','Turfway','Fair Grounds'
];

function isUKIRE(race) {
  const course = (race.course || '').trim();
  return !EXCLUDE_COURSES.some(ex =>
    course.toLowerCase().includes(ex.toLowerCase())
  );
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
