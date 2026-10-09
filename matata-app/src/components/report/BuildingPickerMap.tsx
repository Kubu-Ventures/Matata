'use client';

import { useEffect, useMemo } from 'react';
import { Circle, CircleMarker, MapContainer, Polygon, TileLayer, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { BuildingCandidate } from '@/lib/types';

interface BuildingPickerMapProps {
  lat: number;
  lng: number;
  accuracyM: number | null;
  candidates: BuildingCandidate[];
  selectedId: string | null;
  onSelect: (buildingId: string) => void;
  ariaLabel: string;
}

/** GeoJSON Polygon string → Leaflet rings ([lat, lng] order). */
export function toRings(footprintGeojson: string): [number, number][][] {
  try {
    const geom = JSON.parse(footprintGeojson) as { type: string; coordinates: number[][][] };
    if (geom.type !== 'Polygon') return [];
    return geom.coordinates.map(ring => ring.map(([x, y]) => [y, x] as [number, number]));
  } catch {
    return [];
  }
}

/** Zoom to show the fix and every candidate once they are known. */
function FitToCandidates({ lat, lng, rings }: { lat: number; lng: number; rings: [number, number][][][] }) {
  const map = useMap();
  useEffect(() => {
    const bounds = L.latLngBounds([[lat, lng]]);
    rings.forEach(polygon => polygon.forEach(ring => ring.forEach(pt => bounds.extend(pt))));
    map.fitBounds(bounds, { padding: [32, 32], maxZoom: 19 });
  }, [map, lat, lng, rings]);
  return null;
}

export default function BuildingPickerMap({
  lat,
  lng,
  accuracyM,
  candidates,
  selectedId,
  onSelect,
  ariaLabel,
}: BuildingPickerMapProps) {
  // Memoised so selecting a building doesn't re-run FitToCandidates and jump the view.
  const rings = useMemo(() => candidates.map(c => toRings(c.footprint_geojson)), [candidates]);

  return (
    <div role="group" aria-label={ariaLabel} className="w-full h-56 rounded-lg overflow-hidden border border-[#EDEFF0]">
      <MapContainer center={[lat, lng]} zoom={18} maxZoom={19} scrollWheelZoom={false} className="w-full h-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        {accuracyM !== null && (
          <Circle
            center={[lat, lng]}
            radius={accuracyM}
            pathOptions={{ color: '#006EB5', weight: 1, fillOpacity: 0.06, interactive: false }}
          />
        )}
        {candidates.map((c, i) => {
          const selected = c.building_id === selectedId;
          return (
            <Polygon
              key={c.building_id}
              positions={rings[i]}
              pathOptions={{
                color: selected ? '#006EB5' : '#55606E',
                weight: selected ? 3 : 1.5,
                fillColor: selected ? '#006EB5' : '#B5D5F5',
                fillOpacity: selected ? 0.45 : 0.25,
              }}
              eventHandlers={{ click: () => onSelect(c.building_id) }}
            >
              <Tooltip permanent direction="center" className="!bg-white !border-[#EDEFF0] !text-[#232E3D] !font-semibold !px-1.5 !py-0">
                {i + 1}
              </Tooltip>
            </Polygon>
          );
        })}
        <CircleMarker
          center={[lat, lng]}
          radius={6}
          pathOptions={{ color: '#FFFFFF', weight: 2, fillColor: '#EE402D', fillOpacity: 1, interactive: false }}
        />
        <FitToCandidates lat={lat} lng={lng} rings={rings} />
      </MapContainer>
    </div>
  );
}
