'use client';

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import type { HeatmapFeatureCollection } from '@/lib/types';

interface HeatmapLayerProps {
  data: HeatmapFeatureCollection;
}

/**
 * Imperative leaflet.heat layer, driven by the GeoJSON FeatureCollection
 * returned from GET /stats/heatmap.
 *
 * react-leaflet has no declarative <HeatmapLayer> primitive, so this follows
 * the standard react-leaflet pattern: grab the underlying map instance via
 * useMap(), add/remove a vanilla Leaflet layer imperatively in an effect.
 *
 * Coordinates: GeoJSON is [lng, lat]; Leaflet/leaflet.heat want [lat, lng].
 */
export default function HeatmapLayer({ data }: HeatmapLayerProps) {
  const map = useMap();

  useEffect(() => {
    if (!data.features.length) return;

    const points: Array<[number, number, number]> = data.features.map(f => [
      f.geometry.coordinates[1], // lat
      f.geometry.coordinates[0], // lng
      f.properties.weight,
    ]);

    // `max: 3` matches the backend's severity weight scale (minimal=1,
    // partial=2, destroyed=3) — see get_heatmap()'s _weight_map.
    const layer = L.heatLayer(points, {
      radius: 28,
      blur: 20,
      maxZoom: 17,
      max: 3,
      gradient: {
        0.2: '#006EB5', // low-severity clusters
        0.5: '#FBC412',
        0.8: '#EE402D', // destroyed-heavy clusters
      },
    }).addTo(map);

    return () => {
      map.removeLayer(layer);
    };
  }, [data, map]);

  return null;
}
