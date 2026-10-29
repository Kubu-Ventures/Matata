'use client';

import { useEffect, useRef, useState } from 'react';
import { CircleMarker, MapContainer, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import HeatmapLayer from './HeatmapLayer';
import DamagedBuildingsLayer from './DamagedBuildingsLayer';
import { analystApi } from '@/lib/api';
import type { DamagedBuildingCollection, HeatmapFeatureCollection } from '@/lib/types';

// Default centre: Nairobi — matches the mock geocoding fallback used
// elsewhere in the backend (geocoding_service.MockGeocodingProvider).
const DEFAULT_CENTER: [number, number] = [-1.2921, 36.8219];
const DEFAULT_ZOOM = 12;

/** Zoom straight onto one spot (and optionally highlight a building) instead of fitting all reports. */
export interface MapFocus {
  lat: number;
  lng: number;
  buildingId?: string | null;
}

interface HeatmapMapProps {
  data: HeatmapFeatureCollection;
  focus?: MapFocus | null;
}

// From this zoom on, building outlines are big enough to read, so the heat
// glow (which would sit on top of them) is switched off automatically.
const BUILDING_ZOOM = 17;

/** Pans/zooms the map to fit all report points once, on first load. */
function FitToData({ data, focus }: { data: HeatmapFeatureCollection; focus?: MapFocus | null }) {
  const map = useMap();
  const hasFit = useRef(false);

  useEffect(() => {
    if (hasFit.current) return;
    if (focus) {
      map.setView([focus.lat, focus.lng], 19);
      hasFit.current = true;
      return;
    }
    if (!data.features.length) return;
    const bounds = L.latLngBounds(
      data.features.map(f => [f.geometry.coordinates[1], f.geometry.coordinates[0]] as [number, number])
    );
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
      hasFit.current = true;
    }
  }, [data, focus, map]);

  return null;
}

/** Reports the current zoom level up to the parent. */
function ZoomWatcher({ onZoom }: { onZoom: (z: number) => void }) {
  const map = useMapEvents({ zoomend: () => onZoom(map.getZoom()) });
  useEffect(() => onZoom(map.getZoom()), [map, onZoom]);
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

export default function HeatmapMap({ data, focus }: HeatmapMapProps) {
  const [buildings, setBuildings] = useState<DamagedBuildingCollection | null>(null);
  const [showBuildings, setShowBuildings] = useState(true);
  const [showDots, setShowDots] = useState(true);
  const [showGlow, setShowGlow] = useState(true);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);

  useEffect(() => {
    analystApi
      .damagedBuildings()
      .then(setBuildings)
      .catch(() => setBuildings(null));
  }, []);

  const zoomedIn = zoom >= BUILDING_ZOOM;
  const buildingCount = buildings?.features.length ?? 0;

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        maxZoom={19}
        scrollWheelZoom
        preferCanvas
        className="w-full h-full rounded-lg"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        {showGlow && !zoomedIn && <HeatmapLayer data={data} />}
        {showBuildings && buildings && (
          <DamagedBuildingsLayer data={buildings} focusBuildingId={focus?.buildingId} />
        )}
        {showDots && <ReportDots data={data} />}
        <FitToData data={data} focus={focus} />
        <ZoomWatcher onZoom={setZoom} />
      </MapContainer>

      <div className="absolute right-2 top-2 z-[1000] rounded-md border border-[#EDEFF0] bg-white/95 px-3 py-2 text-xs text-[#232E3D] shadow-sm">
        <p className="mb-1 font-semibold">Show on map</p>
        <label className="flex items-center gap-1.5">
          <input type="checkbox" checked={showBuildings} onChange={e => setShowBuildings(e.target.checked)} />
          Damaged buildings{buildings ? ` (${buildingCount})` : ''}
        </label>
        <label className="flex items-center gap-1.5">
          <input type="checkbox" checked={showDots} onChange={e => setShowDots(e.target.checked)} />
          Report dots
        </label>
        <label className={`flex items-center gap-1.5 ${zoomedIn ? 'opacity-50' : ''}`}>
          <input
            type="checkbox"
            checked={showGlow}
            disabled={zoomedIn}
            onChange={e => setShowGlow(e.target.checked)}
          />
          Heat glow{zoomedIn ? ' (off when zoomed in)' : ''}
        </label>
        {showBuildings && buildingCount > 0 && !zoomedIn && (
          <p className="mt-1 max-w-[170px] text-[11px] text-[#55606E]">Zoom in to see building outlines.</p>
        )}
      </div>
    </div>
  );
}
