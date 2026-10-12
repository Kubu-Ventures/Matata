'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { MapPin } from 'lucide-react';
import { statsApi } from '@/lib/api';
import type { HeatmapFeatureCollection } from '@/lib/types';
import { severityHex, severityLabels } from '@/lib/utils';
import { Alert, EmptyState, PageContainer, PageHeader, Spinner } from '@/components/analyst/ui';

// Leaflet touches `window` at import time, which breaks Next.js SSR/prerender
// even inside a 'use client' file — the component tree still renders once on
// the server for the initial HTML. Loading it with ssr:false defers the
// import to the browser entirely.
const HeatmapMap = dynamic(() => import('@/components/HeatmapMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[#F7F8FA] rounded-lg">
      <Spinner />
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
    <PageContainer className="flex h-[calc(100dvh-3.5rem)] min-h-[520px] flex-col lg:h-[calc(100dvh-6.25rem)]">
      <PageHeader
        className="flex-shrink-0"
        title="Damage Heatmap"
        meta={
          <span>
            {loading ? 'Loading…' : `${pointCount.toLocaleString()} reports plotted, weighted by severity`}
          </span>
        }
      />

      {error && <Alert className="mb-4 flex-shrink-0">{error}</Alert>}

      <div className="relative z-0 flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-[#EDEFF0] bg-white">
        <div className="min-h-0 flex-1">
          {loading ? (
            <div className="w-full h-full flex items-center justify-center">
              <Spinner />
            </div>
          ) : !data || pointCount === 0 ? (
            <EmptyState icon={MapPin} title="No geolocated reports to display yet." className="h-full" />
          ) : (
            <HeatmapMap data={data} />
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-shrink-0 flex-wrap items-center gap-x-4 gap-y-1 border-t border-[#EDEFF0] px-4 py-2.5 text-xs text-[#55606E]">
          <span className="font-medium uppercase tracking-wide">Severity</span>
          {(['minimal', 'partial', 'destroyed'] as const).map(sev => (
            <span key={sev} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: severityHex[sev] }} />
              {severityLabels[sev]}
            </span>
          ))}
          <span className="sm:ml-auto">Dots: each report. Glow: where reports cluster.</span>
        </div>
      </div>
    </PageContainer>
  );
}
