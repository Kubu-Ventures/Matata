/**
 * Data saved on the phone so the report form works without a connection.
 *
 * - Health facilities: the whole list (a few thousand rows for Kenya, about
 *   100 KB) is saved whenever the app is opened online and is older than a
 *   week. Offline, the nearest ones are found on the phone.
 * - Building outlines: saved in tiles of 0.005 degrees (about 550 m): the
 *   tiles around wherever the app was used online (wider on Wi-Fi), a field
 *   reporter's whole home area, and nearby risk areas on Wi-Fi. Offline, the
 *   building picker matches the GPS fix against them with the same rules
 *   the server uses (GISService.match_building), so a building picked
 *   offline has the same id and the same suggested order as online.
 *
 * Nothing here asks the reporter to do anything; it all happens in the
 * background and fails soft.
 */

import { gisApi } from './api';
import { getItem, setItem } from './offlineStore';
import type { BuildingCandidate, HealthFacility } from './types';

// ---------------------------------------------------------------------------
// Health facilities
// ---------------------------------------------------------------------------

type FacilityRow = [string | null, string, number, number, string | null];

interface SavedFacilities {
  fetchedAt: number;
  items: FacilityRow[];
  attribution: string;
}

const FACILITIES_KEY = 'facilities';
const FACILITIES_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const FACILITY_RADIUS_M = 5000;

/** Save the full facility list if the saved copy is missing or a week old. */
export async function refreshFacilities(): Promise<void> {
  const saved = await getItem<SavedFacilities>(FACILITIES_KEY);
  if (saved && Date.now() - saved.fetchedAt < FACILITIES_MAX_AGE_MS) return;
  const res = await gisApi.allHealthFacilities();
  await setItem<SavedFacilities>(FACILITIES_KEY, {
    fetchedAt: Date.now(),
    items: res.items,
    attribution: res.attribution,
  });
}

export interface LocalFacility extends HealthFacility {
  /** Compass direction from the reporter to the facility, in degrees. */
  bearing_deg: number;
}

/** The nearest saved facilities within 5 km, nearest first. */
export async function nearestSavedFacilities(
  lat: number,
  lng: number,
  limit = 3,
): Promise<{ items: LocalFacility[]; attribution: string } | null> {
  const saved = await getItem<SavedFacilities>(FACILITIES_KEY);
  if (!saved) return null;
  const found: LocalFacility[] = [];
  for (const [name, type, flat, flng, phone] of saved.items) {
    const d = haversineM(lat, lng, flat, flng);
    if (d <= FACILITY_RADIUS_M) {
      found.push({
        name,
        facility_type: type as HealthFacility['facility_type'],
        lat: flat,
        lng: flng,
        distance_m: Math.round(d * 10) / 10,
        phone,
        opening_hours: null,
        bearing_deg: bearingDeg(lat, lng, flat, flng),
      });
    }
  }
  found.sort((a, b) => a.distance_m - b.distance_m);
  return { items: found.slice(0, limit), attribution: saved.attribution };
}

// ---------------------------------------------------------------------------
// Building outlines
// ---------------------------------------------------------------------------

type BuildingRow = [string, string, string]; // id, external_id, footprint GeoJSON

interface SavedTile {
  fetchedAt: number;
  items: BuildingRow[];
}

export const TILE_DEG = 0.005;
const TILE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

function tileIndex(value: number): number {
  return Math.floor(value / TILE_DEG);
}

function tileKey(iy: number, ix: number): string {
  return `tile:${iy}:${ix}`;
}

/** Tile keys for the 3 x 3 block centred on the tile holding (lat, lng). */
function tilesAround(lat: number, lng: number, ring = 1): [number, number][] {
  const cy = tileIndex(lat);
  const cx = tileIndex(lng);
  const out: [number, number][] = [];
  for (let dy = -ring; dy <= ring; dy++) {
    for (let dx = -ring; dx <= ring; dx++) out.push([cy + dy, cx + dx]);
  }
  return out;
}

type Connection = { saveData?: boolean; type?: string };

function connection(): Connection {
  if (typeof navigator === 'undefined') return {};
  return (navigator as Navigator & { connection?: Connection }).connection ?? {};
}

/** True on Wi-Fi or a wired link; false on mobile data or when unknown. */
function onUnmeteredLink(): boolean {
  const type = connection().type;
  return type === 'wifi' || type === 'ethernet';
}

// Downloads run one batch after another so two callers never fetch the same
// tile at once; inside a batch, two tiles download in parallel. Rejects if
// any tile failed, so callers know to try again later.
let chain: Promise<void> = Promise.resolve();

function downloadTiles(tiles: [number, number][]): Promise<void> {
  const run = async () => {
    const queue: [number, number][] = [];
    for (const [iy, ix] of tiles) {
      const saved = await getItem<SavedTile>(tileKey(iy, ix));
      if (!saved || Date.now() - saved.fetchedAt > TILE_MAX_AGE_MS) queue.push([iy, ix]);
    }
    let failed = 0;
    const worker = async () => {
      for (let next = queue.shift(); next; next = queue.shift()) {
        const [iy, ix] = next;
        // Round so the box edges don't pick up float noise past the limit.
        const minLat = +(iy * TILE_DEG).toFixed(6);
        const minLng = +(ix * TILE_DEG).toFixed(6);
        try {
          const res = await gisApi.buildingsInBox(
            minLat,
            minLng,
            +(minLat + TILE_DEG).toFixed(6),
            +(minLng + TILE_DEG).toFixed(6),
          );
          await setItem<SavedTile>(tileKey(iy, ix), { fetchedAt: Date.now(), items: res.items });
        } catch {
          failed++; // offline or server busy: try again next time
        }
      }
    };
    await Promise.all([worker(), worker()]);
    if (failed) throw new Error(`${failed} building tiles failed to download`);
  };
  chain = chain.then(run, run);
  return chain;
}

/**
 * Save the building outlines around a point, skipping tiles saved in the
 * last 30 days: about 2.75 km square on Wi-Fi, 1.65 km on mobile data, and
 * only the point's own tile in data-saver mode.
 */
export function prefetchBuildingsAround(lat: number, lng: number): Promise<void> {
  const ring = connection().saveData ? 0 : onUnmeteredLink() ? 2 : 1;
  return downloadTiles(tilesAround(lat, lng, ring));
}

/** Every tile covering a box. */
function tilesInBox([minLat, minLng, maxLat, maxLng]: [number, number, number, number]): [number, number][] {
  const out: [number, number][] = [];
  for (let iy = tileIndex(minLat); iy <= tileIndex(maxLat); iy++) {
    for (let ix = tileIndex(minLng); ix <= tileIndex(maxLng); ix++) out.push([iy, ix]);
  }
  return out;
}

const RISK_AREA_RADIUS_M = 30_000;
// Without a location, every risk area is saved as long as they add up to at
// most this many tiles (about 7.5 km x 7.5 km of a dense area).
const RISK_TILE_BUDGET_NO_LOCATION = 225;

/**
 * Save the areas this phone should have in advance: the reporter's home
 * areas (a field reporter's whole patch), and risk areas within 30 km of
 * the phone, or all of them if the location is unknown and they are small.
 * Skipped in data-saver mode. An area is small (a few hundred KB), so this
 * runs on mobile data too: many phones, iPhones included, don't say whether
 * they are on Wi-Fi. Asks the browser to keep the data through storage
 * clean-ups. Rejects if anything failed, so the caller retries later.
 */
export async function syncOfflineAreas(lat: number | null, lng: number | null): Promise<void> {
  const { areas, home_area_ids } = await gisApi.offlineAreas();
  try {
    await navigator.storage?.persist?.();
  } catch {
    /* not supported: data may be evicted under storage pressure */
  }
  const home = areas.filter(a => home_area_ids.includes(a.id));
  let failed = false;
  for (const area of home) await downloadTiles(tilesInBox(area.bbox)).catch(() => (failed = true));

  let risk = connection().saveData ? [] : areas.filter(a => !home_area_ids.includes(a.id));
  if (lat !== null && lng !== null) {
    risk = risk.filter(a => {
      const [minLat, minLng, maxLat, maxLng] = a.bbox;
      return haversineM(lat, lng, (minLat + maxLat) / 2, (minLng + maxLng) / 2) <= RISK_AREA_RADIUS_M;
    });
  } else {
    const total = risk.reduce((n, a) => n + tilesInBox(a.bbox).length, 0);
    if (total > RISK_TILE_BUDGET_NO_LOCATION) risk = [];
  }
  for (const area of risk) await downloadTiles(tilesInBox(area.bbox)).catch(() => (failed = true));
  if (failed) throw new Error('some offline area tiles failed to download');
}

// Mirrors app/services/gis_service.py so offline suggestions match online ones.
const MAX_CANDIDATES = 3;
const PROBABILITY_POOL = 10;
const ACCURACY_TO_SIGMA = 1.515;
const MAP_SIGMA_M = 2.0;
const DEFAULT_ACCURACY_M = 15;
const DEFAULT_SEARCH_RADIUS_M = 30;

function searchRadiusM(accuracyM: number | null): number {
  if (accuracyM !== null && accuracyM > 50) return Math.min(accuracyM * 1.5, 100);
  return DEFAULT_SEARCH_RADIUS_M;
}

function sigmaM(accuracyM: number | null): number {
  const acc = accuracyM && accuracyM > 0 ? accuracyM : DEFAULT_ACCURACY_M;
  return Math.hypot(acc / ACCURACY_TO_SIGMA, MAP_SIGMA_M);
}

/**
 * Building candidates from saved outlines, in the same shape and order the
 * server returns. Returns null when no outlines are saved for this spot, so
 * the caller can tell "nothing saved" from "no buildings here".
 */
export async function savedBuildingCandidates(
  lat: number,
  lng: number,
  accuracyM: number | null,
): Promise<BuildingCandidate[] | null> {
  let anySaved = false;
  const rows: BuildingRow[] = [];
  for (const [iy, ix] of tilesAround(lat, lng, 1)) {
    const saved = await getItem<SavedTile>(tileKey(iy, ix));
    if (saved) {
      anySaved = true;
      rows.push(...saved.items);
    }
  }
  // The point's own tile must be saved, or the result could miss its building.
  const own = await getItem<SavedTile>(tileKey(tileIndex(lat), tileIndex(lng)));
  if (!anySaved || !own) return null;

  const radius = searchRadiusM(accuracyM);
  const pool: BuildingCandidate[] = [];
  for (const [id, externalId, geojson] of rows) {
    const d = distanceToFootprintM(lat, lng, geojson);
    if (d !== null && d <= radius) {
      pool.push({ building_id: id, external_id: externalId, distance_m: d, footprint_geojson: geojson });
    }
  }
  pool.sort((a, b) => a.distance_m - b.distance_m);
  const top = pool.slice(0, PROBABILITY_POOL);

  const sigma = sigmaM(accuracyM);
  const weights = top.map(c => Math.exp(-(c.distance_m * c.distance_m) / (2 * sigma * sigma)));
  const total = weights.reduce((a, b) => a + b, 0);
  top.forEach((c, i) => {
    c.probability = total > 0 ? weights[i] / total : 1 / top.length;
  });
  return top.slice(0, MAX_CANDIDATES);
}

// ---------------------------------------------------------------------------
// Geometry
// ---------------------------------------------------------------------------

const EARTH_RADIUS_M = 6_371_000;
const RAD = Math.PI / 180;

export function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dp = (lat2 - lat1) * RAD;
  const dl = (lng2 - lng1) * RAD;
  const a = Math.sin(dp / 2) ** 2 + Math.cos(lat1 * RAD) * Math.cos(lat2 * RAD) * Math.sin(dl / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(a));
}

export function bearingDeg(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const y = Math.sin((lng2 - lng1) * RAD) * Math.cos(lat2 * RAD);
  const x =
    Math.cos(lat1 * RAD) * Math.sin(lat2 * RAD) -
    Math.sin(lat1 * RAD) * Math.cos(lat2 * RAD) * Math.cos((lng2 - lng1) * RAD);
  return (Math.atan2(y, x) / RAD + 360) % 360;
}

/** An arrow pointing from the reporter towards the bearing. */
export function bearingArrow(deg: number): string {
  return ['↑', '↗', '→', '↘', '↓', '↙', '←', '↖'][Math.round(deg / 45) % 8];
}

/**
 * Metres from (lat, lng) to the edge of a GeoJSON Polygon; 0 when inside.
 * Uses a local flat projection around the point, accurate to centimetres
 * over the 100 m the picker searches.
 */
export function distanceToFootprintM(lat: number, lng: number, geojson: string): number | null {
  let rings: number[][][];
  try {
    const geom = JSON.parse(geojson) as { type: string; coordinates: number[][][] };
    if (geom.type !== 'Polygon' || !geom.coordinates?.length) return null;
    rings = geom.coordinates;
  } catch {
    return null;
  }
  const kx = Math.cos(lat * RAD) * RAD * EARTH_RADIUS_M;
  const ky = RAD * EARTH_RADIUS_M;
  const proj = rings.map(ring => ring.map(([x, y]) => [(x - lng) * kx, (y - lat) * ky] as [number, number]));

  const inside = (ring: [number, number][]) => {
    let c = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i];
      const [xj, yj] = ring[j];
      if (yi > 0 !== yj > 0 && 0 < ((xj - xi) * (0 - yi)) / (yj - yi) + xi) c = !c;
    }
    return c;
  };
  if (inside(proj[0]) && !proj.slice(1).some(inside)) return 0;

  let best = Infinity;
  for (const ring of proj) {
    for (let i = 0; i < ring.length - 1; i++) {
      best = Math.min(best, segmentDistance(ring[i], ring[i + 1]));
    }
  }
  return Number.isFinite(best) ? best : null;
}

/** Distance from the origin to the segment a-b. */
function segmentDistance([ax, ay]: [number, number], [bx, by]: [number, number]): number {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, -(ax * dx + ay * dy) / len2));
  return Math.hypot(ax + t * dx, ay + t * dy);
}
