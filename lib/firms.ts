export interface FIRMSDetection {
  id: string;
  latitude: number;
  longitude: number;
  frp: number;           // Fire Radiative Power in MW
  confidence: 'l' | 'n' | 'h';
  acqDate: string;       // YYYY-MM-DD
  acqTime: string;       // HHMM
  daynight: 'D' | 'N';
  satellite: string;
  refinery: string;      // name of the nearby refinery/terminal
}

// Hemispheric refinery / terminal locations — Americas-focused with hemispheric reach.
// Used to filter: only return FIRMS detections within RADIUS_DEG of a known facility.
const KEY_FACILITIES: { name: string; lat: number; lon: number }[] = [
  // US Gulf Coast (PADD 3) — bulk of US refining capacity
  { name: 'Motiva Port Arthur, TX',          lat: 29.864, lon: -93.943 },
  { name: 'Marathon Galveston Bay, TX',      lat: 29.387, lon: -94.913 },
  { name: 'ExxonMobil Baytown, TX',          lat: 29.736, lon: -94.991 },
  { name: 'Phillips 66 Sweeny, TX',          lat: 29.039, lon: -95.711 },
  { name: 'Valero Corpus Christi, TX',       lat: 27.819, lon: -97.402 },
  { name: 'Marathon Garyville, LA',          lat: 30.073, lon: -90.614 },
  { name: 'ExxonMobil Baton Rouge, LA',      lat: 30.499, lon: -91.198 },
  { name: 'Citgo Lake Charles, LA',          lat: 30.200, lon: -93.300 },
  { name: 'Chevron Pascagoula, MS',          lat: 30.360, lon: -88.554 },
  // US East Coast (PADD 1)
  { name: 'Phillips 66 Bayway, NJ',          lat: 40.624, lon: -74.211 },
  { name: 'Monroe Trainer, PA',              lat: 39.833, lon: -75.398 },
  // US West Coast (PADD 5)
  { name: 'Marathon Carson, CA',             lat: 33.820, lon: -118.247 },
  { name: 'Chevron El Segundo, CA',          lat: 33.916, lon: -118.430 },
  { name: 'Phillips 66 Rodeo, CA',           lat: 38.040, lon: -122.272 },
  // Caribbean
  { name: 'Limetree Bay, St. Croix (USVI)',  lat: 17.708, lon: -64.738 },
  // Latin America
  { name: 'Cardón / Paraguaná (Venezuela)',  lat: 11.650, lon: -70.185 },
  { name: 'Salina Cruz (Mexico)',            lat: 16.182, lon: -95.197 },
  { name: 'Cartagena Refinery (Colombia)',   lat: 10.322, lon: -75.501 },
  { name: 'REPLAN Paulínia (Brazil)',        lat: -22.713, lon: -47.131 },
];

// ~15km radius at mid-latitudes
const RADIUS_DEG = 0.14;

// Bounding boxes covering the facility regions: "west,south,east,north"
const QUERY_AREAS = [
  '-98,26,-85,32',   // US Gulf Coast (TX/LA/MS)
  '-76,39,-73,42',   // US Mid-Atlantic (NJ/PA)
  '-123,32,-117,39', // US West Coast (CA)
  '-72,10,-64,19',   // Caribbean + Paraguaná (USVI, Venezuela)
  '-96,15,-93,17',   // Mexico (Salina Cruz)
  '-76,9,-74,11',    // Colombia (Cartagena)
  '-48,-24,-46,-22', // Brazil (REPLAN Paulínia)
];

type RawFIRMS = {
  latitude: string;
  longitude: string;
  frp: string;
  confidence: string;
  acq_date: string;
  acq_time: string;
  daynight: string;
  satellite: string;
};

function nearestFacility(lat: number, lon: number): string | null {
  for (const f of KEY_FACILITIES) {
    const d = Math.sqrt((lat - f.lat) ** 2 + (lon - f.lon) ** 2);
    if (d <= RADIUS_DEG) return f.name;
  }
  return null;
}

async function fetchArea(mapKey: string, area: string): Promise<FIRMSDetection[]> {
  const url = `https://firms.modaps.eosdis.nasa.gov/api/area/json/${mapKey}/VIIRS_SNPP_NRT/${area}/1`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  const res = await fetch(url, {
    signal: controller.signal,
    next: { revalidate: 3600 },
  });
  clearTimeout(timeout);

  if (!res.ok) return [];

  const contentType = res.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json') && !contentType.includes('text/json')) {
    const text = await res.text();
    if (text.trimStart().startsWith('<')) return []; // FIRMS HTML error page
    try {
      const parsed = JSON.parse(text) as RawFIRMS[];
      return processRaw(parsed);
    } catch {
      return [];
    }
  }

  const raw = await res.json() as RawFIRMS[];
  return processRaw(raw);
}

function processRaw(raw: RawFIRMS[]): FIRMSDetection[] {
  const results: FIRMSDetection[] = [];
  for (const r of raw) {
    const lat = parseFloat(r.latitude);
    const lon = parseFloat(r.longitude);
    const frp = parseFloat(r.frp);
    if (isNaN(lat) || isNaN(lon) || isNaN(frp)) continue;

    if (r.confidence === 'l') continue;

    const refinery = nearestFacility(lat, lon);
    if (!refinery) continue;

    results.push({
      id: `${r.acq_date}-${r.acq_time}-${lat.toFixed(3)}-${lon.toFixed(3)}`,
      latitude: lat,
      longitude: lon,
      frp,
      confidence: r.confidence as 'l' | 'n' | 'h',
      acqDate: r.acq_date,
      acqTime: r.acq_time,
      daynight: r.daynight as 'D' | 'N',
      satellite: r.satellite,
      refinery,
    });
  }
  return results;
}

export type FIRMSStatus = 'ok' | 'no_key' | 'error';

export async function getFIRMSDetections(): Promise<{ status: FIRMSStatus; detections: FIRMSDetection[] }> {
  const mapKey = process.env.FIRMS_MAP_KEY;
  if (!mapKey) return { status: 'no_key', detections: [] };

  try {
    const results = await Promise.allSettled(
      QUERY_AREAS.map(area => fetchArea(mapKey, area))
    );

    const detections: FIRMSDetection[] = [];
    for (const r of results) {
      if (r.status === 'fulfilled') detections.push(...r.value);
    }

    const seen = new Set<string>();
    const unique = detections.filter(d => {
      if (seen.has(d.id)) return false;
      seen.add(d.id);
      return true;
    });

    return {
      status: 'ok',
      detections: unique.sort((a, b) => b.frp - a.frp),
    };
  } catch {
    return { status: 'error', detections: [] };
  }
}

export function frpSeverity(frp: number): 'red' | 'orange' | 'yellow' | 'gray' {
  if (frp >= 500) return 'red';
  if (frp >= 100) return 'orange';
  if (frp >= 30)  return 'yellow';
  return 'gray';
}
