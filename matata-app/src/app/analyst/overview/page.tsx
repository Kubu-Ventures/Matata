'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  ArrowRight,
  ClipboardList,
  GitMerge,
  House,
  MapPin,
  Plus,
  RefreshCw,
  TriangleAlert,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { statsApi, analystApi } from '@/lib/api';
import type { StatsSummaryResponse, AIAccuracyResponse, HeatmapFeatureCollection } from '@/lib/types';
import { crisisLabels, severityHex, severityLabels, formatPercent, timeAgo, streamEventMeta } from '@/lib/utils';
import { useAnalystStreamContext } from '@/contexts/AnalystStreamContext';
import {
  Alert,
  BarRow,
  DefinitionList,
  EmptyState,
  KeyFigure,
  KeyFigureRow,
  LoadingBlock,
  PageContainer,
  PageHeader,
  Panel,
  Spinner,
} from '@/components/analyst/ui';

// Leaflet touches `window` at import time, so the map loads in the browser only.
const HeatmapMap = dynamic(() => import('@/components/HeatmapMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[#F7F8FA]">
      <Spinner />
    </div>
  ),
});

const SEVERITIES = ['destroyed', 'partial', 'minimal'] as const;

const EVENT_ICONS: Record<string, LucideIcon> = {
  'report.created': Plus,
  'report.updated': RefreshCw,
  'report.critical': TriangleAlert,
  'report.ai_divergence': Zap,
};

const linkClass = 'inline-flex items-center gap-1 font-medium text-[#006EB5] hover:underline';

export default function AnalystOverviewPage() {
  const [stats, setStats] = useState<StatsSummaryResponse | null>(null);
  const [accuracy, setAccuracy] = useState<AIAccuracyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [mapData, setMapData] = useState<HeatmapFeatureCollection | null>(null);
  const [mapLoading, setMapLoading] = useState(true);
  const { events, status } = useAnalystStreamContext();

  useEffect(() => {
    Promise.all([statsApi.summary(), analystApi.getAIAccuracy().catch(() => null)])
      .then(([s, a]) => {
        setStats(s);
        setAccuracy(a);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    statsApi
      .heatmap()
      .then(setMapData)
      .catch(() => {})
      .finally(() => setMapLoading(false));
  }, []);

  if (loading) {
    return <LoadingBlock />;
  }

  const severityTotal = stats ? SEVERITIES.reduce((sum, sev) => sum + (stats.by_severity[sev] ?? 0), 0) : 0;
  const crisisRows = stats
    ? Object.entries(stats.by_crisis_type)
        .filter(([, count]) => count > 0)
        .sort(([, a], [, b]) => b - a)
    : [];
  const pointCount = mapData?.features.length ?? 0;

  return (
    <PageContainer>
      <PageHeader
        title="Situation Overview"
        meta={
          <>
            {stats && <span>Last updated {timeAgo(stats.last_updated)}</span>}
            <span className="capitalize">Feed: {status}</span>
          </>
        }
        actions={
          <>
            {stats && stats.pending_duplicate_count > 0 && (
              <Link
                href="/analyst/merge-review"
                className="inline-flex items-center gap-1.5 rounded-md border border-[#FBC412]/40 bg-[#FBC412]/15 px-3 py-1.5 text-sm font-medium text-[#232E3D] transition-colors hover:bg-[#FBC412]/25"
              >
                {stats.pending_duplicate_count} merge{stats.pending_duplicate_count === 1 ? '' : 's'} awaiting review
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            )}
            <Link
              href="/analyst/dashboard"
              className="inline-flex items-center gap-1.5 rounded-md bg-[#006EB5] px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#005a94]"
            >
              <ClipboardList className="h-4 w-4" aria-hidden="true" />
              Review reports
            </Link>
          </>
        }
      />

      {/* Key figures */}
      <KeyFigureRow className="mb-5 grid-cols-2 lg:grid-cols-5">
        <KeyFigure
          className="col-span-2 lg:col-span-1"
          icon={ClipboardList}
          label="Active reports"
          value={stats?.total.toLocaleString() ?? '—'}
          href="/analyst/dashboard"
        />
        <KeyFigure
          icon={TriangleAlert}
          label="Destroyed"
          value={stats?.by_severity.destroyed ?? 0}
          tone="text-[#EE402D]"
          iconClassName="bg-[#EE402D]/10 text-[#EE402D]"
        />
        <KeyFigure
          icon={House}
          label="Partial damage"
          value={stats?.by_severity.partial ?? 0}
          tone="text-orange-600"
          iconClassName="bg-orange-100 text-orange-600"
        />
        <KeyFigure icon={House} label="Minimal damage" value={stats?.by_severity.minimal ?? 0} />
        <KeyFigure
          icon={GitMerge}
          label="Pending merges"
          value={stats?.pending_duplicate_count ?? 0}
          tone={stats && stats.pending_duplicate_count > 0 ? 'text-[#232E3D]' : undefined}
          iconClassName={
            stats && stats.pending_duplicate_count > 0 ? 'bg-[#FBC412]/20 text-[#232E3D]' : undefined
          }
          href="/analyst/merge-review"
        />
      </KeyFigureRow>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Map */}
        <Panel
          className="lg:col-span-2"
          title="Where damage is reported"
          description={
            mapLoading
              ? 'Loading…'
              : `${pointCount.toLocaleString()} geolocated report${pointCount === 1 ? '' : 's'}, coloured by severity`
          }
          action={
            <Link href="/analyst/heatmap" className={linkClass}>
              Open map <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          }
          bodyClassName="p-0 sm:p-0"
        >
          <div className="relative z-0 h-[320px] overflow-hidden rounded-b-lg sm:h-[400px] lg:h-[440px]">
            {mapLoading ? (
              <div className="flex h-full w-full items-center justify-center">
                <Spinner />
              </div>
            ) : !mapData || pointCount === 0 ? (
              <EmptyState icon={MapPin} title="No geolocated reports yet" className="h-full">
                Reports with a GPS fix appear here as they arrive.
              </EmptyState>
            ) : (
              <HeatmapMap data={mapData} />
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-[#EDEFF0] px-4 py-2.5 text-xs text-[#55606E] sm:px-5">
            {(['minimal', 'partial', 'destroyed'] as const).map(sev => (
              <span key={sev} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: severityHex[sev] }} />
                {severityLabels[sev]}
              </span>
            ))}
          </div>
        </Panel>

        <div className="space-y-5">
          {/* Severity breakdown */}
          <Panel title="Damage severity" description="Share of active reports">
            {severityTotal === 0 ? (
              <p className="text-sm text-[#55606E]">No active reports yet.</p>
            ) : (
              <>
                <div
                  className="flex h-3 overflow-hidden rounded-full bg-[#F7F8FA]"
                  role="img"
                  aria-label={SEVERITIES.map(
                    sev => `${severityLabels[sev]} ${stats?.by_severity[sev] ?? 0}`
                  ).join(', ')}
                >
                  {SEVERITIES.map(sev => {
                    const count = stats?.by_severity[sev] ?? 0;
                    if (!count) return null;
                    return (
                      <span
                        key={sev}
                        style={{ width: `${(count / severityTotal) * 100}%`, backgroundColor: severityHex[sev] }}
                      />
                    );
                  })}
                </div>
                <ul className="mt-4 space-y-2 text-sm">
                  {SEVERITIES.map(sev => {
                    const count = stats?.by_severity[sev] ?? 0;
                    return (
                      <li key={sev} className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-2 text-[#232E3D]">
                          <span
                            className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                            style={{ backgroundColor: severityHex[sev] }}
                          />
                          {severityLabels[sev]}
                        </span>
                        <span className="tabular-nums text-[#55606E]">
                          <span className="font-semibold text-[#232E3D]">{count.toLocaleString()}</span>
                          {' · '}
                          {Math.round((count / severityTotal) * 100)}%
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </Panel>

          {/* By crisis type */}
          <Panel title="Reports by crisis type">
            {crisisRows.length === 0 ? (
              <p className="text-sm text-[#55606E]">No active reports yet.</p>
            ) : (
              <div className="space-y-3">
                {crisisRows.map(([type, count]) => (
                  <BarRow
                    key={type}
                    label={crisisLabels[type] || type}
                    value={count.toLocaleString()}
                    percent={stats && stats.total > 0 ? (count / stats.total) * 100 : 0}
                  />
                ))}
              </div>
            )}
          </Panel>
        </div>

        {/* Live activity feed */}
        <Panel
          className="lg:col-span-2"
          title="Live activity"
          description="New reports and AI divergence alerts, as they happen"
          action={<span className="capitalize text-[#55606E]">{status}</span>}
        >
          {events.length === 0 ? (
            <p className="text-sm text-[#55606E]">
              Waiting for activity — new reports and AI divergence alerts will appear here in real
              time.
            </p>
          ) : (
            <ul className="max-h-80 divide-y divide-[#EDEFF0] overflow-y-auto">
              {events.map((evt, i) => {
                const meta = streamEventMeta[evt.event] || {
                  label: evt.event,
                  color: 'text-[#55606E]',
                  icon: '•',
                };
                const EventIcon = EVENT_ICONS[evt.event];
                return (
                  <li
                    key={`${evt.report_id}-${i}`}
                    className="flex items-center justify-between gap-3 py-2 text-sm first:pt-0 last:pb-0"
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span
                        className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#F7F8FA] text-xs ${meta.color}`}
                        aria-hidden="true"
                      >
                        {EventIcon ? <EventIcon className="h-3.5 w-3.5" /> : meta.icon}
                      </span>
                      <span className="truncate text-[#232E3D]">{meta.label}</span>
                      {evt.review_priority && (
                        <span className="flex-shrink-0 text-xs capitalize text-[#55606E]">({evt.review_priority})</span>
                      )}
                    </span>
                    {evt.report_id && (
                      <Link href={`/analyst/reports/${evt.report_id}`} className={`${linkClass} flex-shrink-0 text-xs`}>
                        View
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        {/* AI accuracy snapshot */}
        <Panel
          title="AI calibration"
          action={
            <Link href="/analyst/ai-accuracy" className={linkClass}>
              Details <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          }
        >
          {!accuracy || accuracy.total_feedback === 0 ? (
            <p className="text-sm leading-relaxed text-[#55606E]">
              No analyst feedback recorded yet. Verify, reject, or override a few reports to begin
              calibration.
            </p>
          ) : (
            <>
              <DefinitionList
                rows={[
                  { label: 'Overall agreement', value: formatPercent(accuracy.agreement_rate) },
                  {
                    label: 'High-confidence agreement',
                    value: formatPercent(accuracy.high_confidence_agreement_rate),
                  },
                  { label: 'Feedback samples', value: accuracy.total_feedback },
                  { label: 'Divergence threshold', value: accuracy.recommended_divergence_threshold ?? '—' },
                ]}
              />
              {accuracy.threshold_is_stale && (
                <Alert tone="warning" className="mt-3 text-xs">
                  Calibration hasn&apos;t refreshed recently — analyst review throughput may have
                  dropped.
                </Alert>
              )}
            </>
          )}
        </Panel>
      </div>
    </PageContainer>
  );
}
