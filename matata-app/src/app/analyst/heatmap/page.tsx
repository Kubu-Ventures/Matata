'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { statsApi } from '@/lib/api';
import type { HeatmapFeatureCollection } from '@/lib/types';

// Leaflet touches `window` at import time, which breaks Next.js SSR/prerender
// even inside a 'use client' file — the component tree still renders once on
// the server for the initial HTML. Loading it with ssr:false defers the
// import to the browser entirely.
const HeatmapMap = dynamic(() => import('@/components/HeatmapMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[#F7F8FA] rounded-lg">
      <div className="animate-spin w-6 h-6 border-2 border-[#006EB5] border-t-transparent rounded-full" />
    </div>
  ),
});

export default function HeatmapPage() {
  const [data, setData] = useState<HeatmapFeatureCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    statsApi
      .heatmap()
      .then(setData)
      .catch(() => setError('Could not load heatmap data.'))
      .finally(() => setLoading(false));
  }, []);

  const pointCount = data?.features.length ?? 0;

  return (
    <div className="p-6 h-screen flex flex-col max-w-6xl">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold text-[#232E3D]">Damage Heatmap</h1>
          <p className="text-sm text-[#55606E] mt-0.5">
            {loading ? 'Loading…' : `${pointCount.toLocaleString()} reports plotted, weighted by severity`}
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs text-[#55606E]">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#006EB5]" /> Minimal
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FBC412]" /> Partial
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#EE402D]" /> Destroyed
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-3 mb-4 flex-shrink-0">
          <p className="text-sm text-[#EE402D]">{error}</p>
        </div>
      )}

      <div className="flex-1 bg-white rounded-lg border border-[#EDEFF0] p-2 min-h-0">
        {loading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="animate-spin w-6 h-6 border-2 border-[#006EB5] border-t-transparent rounded-full" />
          </div>
        ) : !data || pointCount === 0 ? (
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-sm text-[#55606E]">No geolocated reports to display yet.</p>
          </div>
        ) : (
          <HeatmapMap data={data} />
        )}
      </div>
    </div>
  );
}
