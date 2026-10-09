'use client';

import { useEffect, useMemo } from 'react';
import { Circle, CircleMarker, MapContainer, Polygon, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { toRings } from '@/components/report/BuildingPickerMap';

interface MatchedBuildingMapProps {
  footprintGeojson: string;
  /** The reporter's GPS fix, when the report has one (landmark-only reports don't). */
  lat: number | null;
  lng: number | null;
  accuracyM: number | null;
}

/** Zoom to show the footprint and the GPS fix together. */
function FitToFootprint({ rings, fix }: { rings: [number, number][][]; fix: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    const bounds = L.latLngBounds([]);
    rings.forEach(ring => ring.forEach(pt => bounds.extend(pt)));
    if (fix) bounds.extend(fix);
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [24, 24], maxZoom: 19 });
  }, [map, rings, fix]);
  return null;
}

/** Read-only map of the building a report was matched to, with the reporter's GPS fix. */
export default function MatchedBuildingMap({ footprintGeojson, lat, lng, accuracyM }: MatchedBuildingMapProps) {
  const rings = useMemo(() => toRings(footprintGeojson), [footprintGeojson]);
  const fix = useMemo<[number, number] | null>(
    () => (lat !== null && lng !== null ? [lat, lng] : null),
    [lat, lng],
  );
  const center = fix ?? rings[0]?.[0];
  if (!center) return null;

  return (
    <div
      role="img"
      aria-label="Map of the matched building outline and the reporter's GPS position"
      className="w-full h-48 rounded-lg overflow-hidden border border-[#EDEFF0]"
    >
      <MapContainer center={center} zoom={18} maxZoom={19} scrollWheelZoom={false} className="w-full h-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        <Polygon
          positions={rings}
          pathOptions={{ color: '#006EB5', weight: 2, fillColor: '#006EB5', fillOpacity: 0.35, interactive: false }}
        />
        {fix && accuracyM !== null && (
          <Circle
            center={fix}
            radius={accuracyM}
            pathOptions={{ color: '#EE402D', weight: 1, fillOpacity: 0.05, interactive: false }}
          />
        )}
        {fix && (
          <CircleMarker
            center={fix}
            radius={6}
            pathOptions={{ color: '#FFFFFF', weight: 2, fillColor: '#EE402D', fillOpacity: 1, interactive: false }}
          />
        )}
        <FitToFootprint rings={rings} fix={fix} />
      </MapContainer>
    </div>
  );
}
