/** Google Maps walking/driving directions to a point (opens the app on phones). */
export function directionsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

/** OpenStreetMap page for a building, from an external_id like "osm:way/123". */
export function osmUrl(externalId: string): string | null {
  const m = /^osm:(way|relation|node)\/(\d+)$/.exec(externalId);
  return m ? `https://www.openstreetmap.org/${m[1]}/${m[2]}` : null;
}

/** Link to the damage map, zoomed onto one building. */
export function damageMapUrl(lat: number, lng: number, buildingId?: string | null): string {
  const q = new URLSearchParams({ lat: String(lat), lng: String(lng) });
  if (buildingId) q.set('building', buildingId);
  return `/analyst/heatmap?${q.toString()}`;
}

/** Rough centre of a polygon ring (mean of its vertices), as [lat, lng]. */
export function ringCentre(ring: [number, number][]): [number, number] | null {
  const pts = ring.length > 1 ? ring.slice(0, -1) : ring;
  if (!pts.length) return null;
  const lat = pts.reduce((s, p) => s + p[0], 0) / pts.length;
  const lng = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  return [lat, lng];
}

/** Centre of a footprint given as a GeoJSON Polygon string, as [lat, lng]. */
export function footprintCentre(footprintGeojson: string | null | undefined): [number, number] | null {
  if (!footprintGeojson) return null;
  try {
    const geom = JSON.parse(footprintGeojson) as { type: string; coordinates: number[][][] };
    if (geom.type !== 'Polygon' || !geom.coordinates[0]) return null;
    return ringCentre(geom.coordinates[0].map(([x, y]) => [y, x] as [number, number]));
  } catch {
    return null;
  }
}
