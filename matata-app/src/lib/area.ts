/**
 * Areas that limit an analyst or responder account.
 *
 * Admins type (or quick-add) boxes, one per line, as
 * `min_lat, min_lng, max_lat, max_lng`: the same order the backend CLI and
 * offline areas use. They are stored as a GeoJSON MultiPolygon, which is
 * what the backend checks every report against.
 */

/** [min_lat, min_lng, max_lat, max_lng] */
export type Box = [number, number, number, number];

export interface ParsedBoxes {
  boxes: Box[];
  /** One message per line that could not be read, e.g. "Line 2: …". */
  errors: string[];
}

export function parseBoxLine(line: string): Box | string {
  const parts = line.split(',').map(p => p.trim()).filter(p => p !== '');
  if (parts.length !== 4) {
    return 'needs four numbers: min_lat, min_lng, max_lat, max_lng';
  }
  const nums = parts.map(Number);
  if (nums.some(n => !Number.isFinite(n))) return 'contains something that is not a number';
  const [minLat, minLng, maxLat, maxLng] = nums;
  if (!(minLat >= -90 && maxLat <= 90 && minLat < maxLat)) {
    return 'latitudes must go from smaller to larger (south first), between -90 and 90';
  }
  if (!(minLng >= -180 && maxLng <= 180 && minLng < maxLng)) {
    return 'longitudes must go from smaller to larger (west first), between -180 and 180';
  }
  return [minLat, minLng, maxLat, maxLng];
}

export function parseBoxes(text: string): ParsedBoxes {
  const boxes: Box[] = [];
  const errors: string[] = [];
  text.split('\n').forEach((raw, i) => {
    const line = raw.trim();
    if (!line) return;
    const result = parseBoxLine(line);
    if (typeof result === 'string') errors.push(`Line ${i + 1}: ${result}.`);
    else boxes.push(result);
  });
  return { boxes, errors };
}

export function formatBox(box: Box): string {
  return box.join(', ');
}

export function boxesToText(boxes: Box[]): string {
  return boxes.map(formatBox).join('\n');
}

/** GeoJSON MultiPolygon string, matching the backend's `bboxes_to_region`. */
export function boxesToRegion(boxes: Box[]): string {
  return JSON.stringify({
    type: 'MultiPolygon',
    coordinates: boxes.map(([minLat, minLng, maxLat, maxLng]) => [
      [
        [minLng, minLat],
        [maxLng, minLat],
        [maxLng, maxLat],
        [minLng, maxLat],
        [minLng, minLat],
      ],
    ]),
  });
}

type Ring = number[][];

function ringToBox(ring: Ring): Box | null {
  if (!Array.isArray(ring) || ring.length !== 5) return null;
  const lngs = ring.map(p => p[0]);
  const lats = ring.map(p => p[1]);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const onCorner = ring.every(
    ([lng, lat]) => (lng === minLng || lng === maxLng) && (lat === minLat || lat === maxLat),
  );
  return onCorner ? [minLat, minLng, maxLat, maxLng] : null;
}

/**
 * Read a stored area back as boxes so it can be edited. Returns null when
 * the area is a shape other than plain boxes (e.g. drawn as a polygon
 * elsewhere): the page then shows it as a custom area.
 */
export function regionToBoxes(region: string | null): Box[] | null {
  if (!region) return [];
  try {
    let geom = JSON.parse(region);
    if (geom?.type === 'Feature') geom = geom.geometry;
    const polygons: Ring[][] =
      geom?.type === 'Polygon' ? [geom.coordinates] : geom?.type === 'MultiPolygon' ? geom.coordinates : null;
    if (!polygons) return null;
    const boxes: Box[] = [];
    for (const rings of polygons) {
      if (rings.length !== 1) return null;
      const box = ringToBox(rings[0]);
      if (!box) return null;
      boxes.push(box);
    }
    return boxes;
  } catch {
    return null;
  }
}

/** Outer rings of every shape in an area, as [lat, lng] for drawing on a map. */
export function regionOutlines(region: string | null): [number, number][][] {
  if (!region) return [];
  try {
    let geom = JSON.parse(region);
    if (geom?.type === 'Feature') geom = geom.geometry;
    const polygons: Ring[][] =
      geom?.type === 'Polygon' ? [geom.coordinates] : geom?.type === 'MultiPolygon' ? geom.coordinates : [];
    return polygons.map(rings => rings[0].map(([lng, lat]) => [lat, lng] as [number, number]));
  } catch {
    return [];
  }
}

/** Short description for the accounts table. */
export function describeRegion(region: string | null): string {
  if (!region) return 'All areas';
  const n = regionOutlines(region).length;
  return n === 1 ? 'Limited: 1 area' : `Limited: ${n} areas`;
}
