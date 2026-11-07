'use client';

import { useEffect } from 'react';
import { MapContainer, Polygon, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/** Nairobi, shown when no area has been entered yet. */
const DEFAULT_CENTER: [number, number] = [-1.29, 36.82];

function FitToOutlines({ outlines }: { outlines: [number, number][][] }) {
  const map = useMap();
  const key = JSON.stringify(outlines);
  useEffect(() => {
    const points = outlines.flat();
    if (points.length === 0) return;
    map.fitBounds(L.latLngBounds(points), { padding: [16, 16], maxZoom: 15 });
    // `key` captures the outlines' content; the array identity changes on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, key]);
  return null;
}

/**
 * Small read-only map showing the area an account will be limited to, so an
 * admin can check the boxes cover the right places before saving.
 */
export default function AreaMapPreview({ outlines }: { outlines: [number, number][][] }) {
  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={11}
      scrollWheelZoom={false}
      className="h-56 w-full rounded border border-[#EDEFF0]"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      {outlines.map((ring, i) => (
        <Polygon
          key={i}
          positions={ring}
          pathOptions={{ color: '#006EB5', weight: 2, fillOpacity: 0.15 }}
        />
      ))}
      <FitToOutlines outlines={outlines} />
    </MapContainer>
  );
}
