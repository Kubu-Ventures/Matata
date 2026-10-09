'use client';

import { useEffect, useRef } from 'react';
import { CircleMarker, MapContainer, TileLayer, Tooltip, useMap } from 'react-leaflet';
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

// Backend weight (see get_heatmap()'s _weight_map) → severity and the legend colour.
const SEVERITY_BY_WEIGHT: Record<number, { label: string; color: string }> = {
  1: { label: 'Minimal', color: '#006EB5' },
  2: { label: 'Partial', color: '#FBC412' },
  3: { label: 'Destroyed', color: '#EE402D' },
};

/**
 * One dot per report on top of the heat glow. The glow shows where reports
 * cluster; the dots make every single report findable, including a lone one
 * the glow alone would leave faint.
 */
function ReportDots({ data }: { data: HeatmapFeatureCollection }) {
  return (
    <>
      {data.features.map((f, i) => {
        const severity = SEVERITY_BY_WEIGHT[f.properties.weight] ?? SEVERITY_BY_WEIGHT[1];
        return (
          <CircleMarker
            key={i}
            center={[f.geometry.coordinates[1], f.geometry.coordinates[0]]}
            radius={6}
            pathOptions={{ color: '#FFFFFF', weight: 2, fillColor: severity.color, fillOpacity: 1 }}
          >
            <Tooltip direction="top" offset={[0, -6]}>
              {severity.label}
            </Tooltip>
          </CircleMarker>
        );
      })}
    </>
  );
}

export default function HeatmapMap({ data }: HeatmapMapProps) {
  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      scrollWheelZoom
      preferCanvas
      className="w-full h-full rounded-lg"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <HeatmapLayer data={data} />
      <ReportDots data={data} />
      <FitToData data={data} />
    </MapContainer>
  );
}