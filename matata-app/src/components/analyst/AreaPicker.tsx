'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { Plus } from 'lucide-react';
import { gisApi } from '@/lib/api';
import { formatBox, parseBoxes, regionOutlines, type Box } from '@/lib/area';
import { Spinner, fieldLabelClass } from '@/components/analyst/ui';

// Leaflet touches `window` at import time, so the map loads in the browser only.
const AreaMapPreview = dynamic(() => import('@/components/analyst/AreaMapPreview'), {
  ssr: false,
  loading: () => (
    <div className="flex h-56 w-full items-center justify-center rounded border border-[#EDEFF0] bg-[#F7F8FA]">
      <Spinner />
    </div>
  ),
});

interface SavedArea {
  id: string;
  name: string;
  bbox: Box;
}

interface AreaPickerProps {
  /** Boxes, one per line: min_lat, min_lng, max_lat, max_lng. */
  value: string;
  onChange: (value: string) => void;
  /**
   * An existing area that is not made of plain boxes. Shown on the map until
   * the admin types boxes to replace it.
   */
  customRegion?: string | null;
}

/**
 * Lets an admin choose the area an account is limited to: type or paste
 * boxes, or add a saved offline area (e.g. a settlement) with one click, and
 * check the result on a map.
 */
export default function AreaPicker({ value, onChange, customRegion }: AreaPickerProps) {
  const [savedAreas, setSavedAreas] = useState<SavedArea[]>([]);

  useEffect(() => {
    let cancelled = false;
    gisApi
      .offlineAreas()
      .then(res => {
        if (!cancelled) setSavedAreas(res.areas.map(a => ({ id: a.id, name: a.name, bbox: a.bbox })));
      })
      .catch(() => {
        /* Quick-add is a convenience; typing boxes still works without it. */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const parsed = useMemo(() => parseBoxes(value), [value]);
  const usingCustom = !!customRegion && value.trim() === '';

  const outlines = useMemo(() => {
    if (usingCustom) return regionOutlines(customRegion ?? null);
    return parsed.boxes.map(([minLat, minLng, maxLat, maxLng]) => [
      [minLat, minLng],
      [minLat, maxLng],
      [maxLat, maxLng],
      [maxLat, minLng],
    ] as [number, number][]);
  }, [parsed.boxes, usingCustom, customRegion]);

  function addBox(box: Box) {
    const line = formatBox(box);
    if (value.split('\n').some(l => l.trim() === line)) return;
    onChange(value.trim() ? `${value.trimEnd()}\n${line}` : line);
  }

  return (
    <div className="space-y-2">
      {savedAreas.length > 0 && (
        <div>
          <span className={fieldLabelClass}>Add a saved area</span>
          <div className="flex flex-wrap gap-1.5">
            {savedAreas.map(area => (
              <button
                key={area.id}
                type="button"
                onClick={() => addBox(area.bbox)}
                className="inline-flex items-center gap-1 rounded-full border border-[#EDEFF0] bg-white px-2.5 py-1 text-xs text-[#232E3D] hover:border-[#006EB5] hover:text-[#006EB5]"
              >
                <Plus className="h-3 w-3" aria-hidden="true" />
                {area.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <label className="block font-normal">
        <span className={fieldLabelClass}>Boxes, one per line</span>
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={'-1.3256, 36.7647, -1.2993, 36.8066'}
          rows={3}
          spellCheck={false}
          className="block w-full rounded border border-[#EDEFF0] bg-white px-2.5 py-2 font-mono text-xs text-[#232E3D] placeholder:text-[#55606E] focus:border-[#006EB5] focus:outline-none focus:ring-1 focus:ring-[#006EB5]"
        />
        <span className="mt-1 block text-xs text-[#55606E]">
          Each line is min latitude, min longitude, max latitude, max longitude (south-west corner first).
        </span>
      </label>

      {parsed.errors.length > 0 && (
        <ul className="space-y-0.5 text-xs text-[#EE402D]">
          {parsed.errors.map(err => (
            <li key={err}>{err}</li>
          ))}
        </ul>
      )}

      {usingCustom && (
        <p className="text-xs text-[#55606E]">
          This account has a custom area drawn as a shape. It is shown below. Type boxes to replace it.
        </p>
      )}

      <AreaMapPreview outlines={outlines} />
    </div>
  );
}
