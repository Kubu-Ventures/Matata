'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import HeatmapLayer from './HeatmapLayer';
import type { HeatmapFeatureCollection } from '@/lib/types';

// Default centre: Nairobi — matches the mock geocoding fallback used
// elsewhere in the backend (geocoding_service.MockGeocodingProvider).
const DEFAULT_CENTER: [number, number] = [-1.2921, 36.8219];
const DEFAULT_ZOOM = 12;

interface HeatmapMapProps {
  data: HeatmapFeatureCollection;
}

/** Pans/zooms the map to fit all report points once, on first load. */
function FitToData({ data }: { data: HeatmapFeatureCollection }) {
  const map = useMap();
  const hasFit = useRef(false);

  useEffect(() => {
    if (hasFit.current || !data.features.length) return;
    const bounds = L.latLngBounds(
      data.features.map(f => [f.geometry.coordinates[1], f.geometry.coordinates[0]] as [number, number])
    );
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
      hasFit.current = true;
    }
  }, [data, map]);

  return null;
}

export default function HeatmapMap({ data }: HeatmapMapProps) {
  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      scrollWheelZoom
      className="w-full h-full rounded-lg"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <HeatmapLayer data={data} />
      <FitToData data={data} />
    </MapContainer>
  );
}