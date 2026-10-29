'use client';

import { useEffect, useRef } from 'react';
import { Polygon, Popup } from 'react-leaflet';
import type L from 'leaflet';
import type { DamagedBuildingCollection } from '@/lib/types';
import { severityHex, severityLabels, timeAgo } from '@/lib/utils';
import { damageMapUrl, directionsUrl, osmUrl } from '@/lib/mapLinks';

interface DamagedBuildingsLayerProps {
  data: DamagedBuildingCollection;
  /** Building to highlight and open, e.g. when arriving from a report page. */
  focusBuildingId?: string | null;
}

/**
 * Every building with a live report, drawn as its real footprint and filled
 * with the worst reported severity. Clicking one shows how many reports it
 * has and links to the latest report, directions and its OpenStreetMap page.
 */
export default function DamagedBuildingsLayer({ data, focusBuildingId }: DamagedBuildingsLayerProps) {
  const focusRef = useRef<L.Polygon | null>(null);

  useEffect(() => {
    focusRef.current?.openPopup();
  }, [data, focusBuildingId]);

  return (
    <>
      {data.features.map(f => {
        const p = f.properties;
        const rings = f.geometry.coordinates.map(ring => ring.map(([x, y]) => [y, x] as [number, number]));
        const color = severityHex[p.severity] ?? severityHex.minimal;
        const focused = p.building_id === focusBuildingId;
        const osm = osmUrl(p.external_id);
        return (
          <Polygon
            key={p.building_id}
            ref={focused ? focusRef : undefined}
            positions={rings}
            pathOptions={{
              color: focused ? '#232E3D' : color,
              weight: focused ? 4 : 2,
              fillColor: color,
              fillOpacity: 0.55,
            }}
          >
            <Popup>
              <div className="min-w-[180px] text-xs leading-relaxed">
                <p className="text-sm font-semibold" style={{ color }}>
                  {severityLabels[p.severity] ?? p.severity} damage
                </p>
                <p>
                  {p.report_count} report{p.report_count === 1 ? '' : 's'}
                  {p.last_report_at && <> · last {timeAgo(p.last_report_at)}</>}
                </p>
                <p className="text-[11px] text-[#55606E]">{p.external_id}</p>
                <div className="mt-1.5 flex flex-col gap-0.5">
                  <a href={`/analyst/reports/${p.latest_report_id}`}>Open latest report →</a>
                  <a href={directionsUrl(p.lat, p.lng)} target="_blank" rel="noopener noreferrer">
                    Directions (Google Maps) ↗
                  </a>
                  {osm && (
                    <a href={osm} target="_blank" rel="noopener noreferrer">
                      View on OpenStreetMap ↗
                    </a>
                  )}
                  {!focused && <a href={damageMapUrl(p.lat, p.lng, p.building_id)}>Zoom to this building</a>}
                </div>
              </div>
            </Popup>
          </Polygon>
        );
      })}
    </>
  );
}
