'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { statsApi, analystApi } from '@/lib/api';
import type { StatsSummaryResponse, AIAccuracyResponse } from '@/lib/types';
import { crisisLabels, severityColors, formatPercent, timeAgo, streamEventMeta } from '@/lib/utils';
import { useAnalystStreamContext } from '@/contexts/AnalystStreamContext';

function StatCard({ label, value, sub, tone }: { label: string; value: string | number; sub?: string; tone?: string }) {
  return (
    <div className="bg-white rounded-lg border border-[#EDEFF0] p-5">
      <p className="text-xs text-[#55606E] uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${tone || 'text-[#232E3D]'}`}>{value}</p>
      {sub && <p className="text-xs text-[#55606E] mt-1">{sub}</p>}
    </div>
  );
}

export default function AnalystOverviewPage() {
  const [stats, setStats] = useState<StatsSummaryResponse | null>(null);
  const [accuracy, setAccuracy] = useState<AIAccuracyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const { events, status } = useAnalystStreamContext();

  useEffect(() => {
    Promise.all([statsApi.summary(), analystApi.getAIAccuracy().catch(() => null)])
      .then(([s, a]) => {
        setStats(s);
        setAccuracy(a);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin w-6 h-6 border-2 border-[#006EB5] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#232E3D]">Situation Overview</h1>
          <p className="text-sm text-[#55606E] mt-0.5">
            {stats ? `Last updated ${timeAgo(stats.last_updated)}` : ''}
          </p>
        </div>
        {stats && stats.pending_duplicate_count > 0 && (
          <Link
            href="/analyst/merge-review"
            className="px-3 py-1.5 text-sm bg-[#FBC412]/15 text-[#232E3D] border border-[#FBC412]/40 rounded-md hover:bg-[#FBC412]/25 transition-colors font-medium"
          >
            {stats.pending_duplicate_count} merge{stats.pending_duplicate_count === 1 ? '' : 's'} awaiting review →
          </Link>
        )}
      </div>

      {/* Top-level counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Active reports" value={stats?.total.toLocaleString() ?? '—'} />
        <StatCard
          label="Destroyed"
          value={stats?.by_severity.destroyed ?? 0}
          tone="text-[#EE402D]"
        />
        <StatCard
          label="Partial damage"
          value={stats?.by_severity.partial ?? 0}
          tone="text-orange-600"
        />
        <StatCard
          label="Pending merges"
          value={stats?.pending_duplicate_count ?? 0}
          tone={stats && stats.pending_duplicate_count > 0 ? 'text-[#FBC412]' : undefined}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* By crisis type */}
        <div className="bg-white rounded-lg border border-[#EDEFF0] p-5 lg:col-span-2">
          <h3 className="font-medium text-[#232E3D] mb-4 text-sm">Reports by crisis type</h3>
          <div className="space-y-3">
            {stats &&
              Object.entries(stats.by_crisis_type)
                .filter(([, count]) => count > 0)
                .sort(([, a], [, b]) => b - a)
                .map(([type, count]) => {
                  const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
                  return (
                    <div key={type}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-[#232E3D] font-medium">{crisisLabels[type] || type}</span>
                        <span className="text-[#55606E]">{count.toLocaleString()}</span>
                      </div>
                      <div className="h-2 bg-[#F7F8FA] rounded-full overflow-hidden">
                        <div className="h-full bg-[#006EB5] rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
            {stats && Object.values(stats.by_crisis_type).every(c => c === 0) && (
              <p className="text-sm text-[#55606E]">No active reports yet.</p>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-[#EDEFF0] flex gap-4">
            {(['minimal', 'partial', 'destroyed'] as const).map(sev => (
              <div key={sev} className="flex-1 text-center">
                <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium capitalize ${severityColors[sev]}`}>
                  {sev}
                </span>
                <p className="text-lg font-bold text-[#232E3D] mt-1">{stats?.by_severity[sev] ?? 0}</p>
              </div>
            ))}
          </div>
        </div>

        {/* AI accuracy snapshot */}
        <div className="bg-white rounded-lg border border-[#EDEFF0] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-[#232E3D] text-sm">AI calibration</h3>
            <Link href="/analyst/ai-accuracy" className="text-xs text-[#006EB5] hover:underline">
              Details →
            </Link>
          </div>
          {!accuracy || accuracy.total_feedback === 0 ? (
            <p className="text-sm text-[#55606E]">
              No analyst feedback recorded yet. Verify, reject, or override a few reports to begin
              calibration.
            </p>
          ) : (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[#55606E]">Overall agreement</span>
                <span className="font-medium text-[#232E3D]">{formatPercent(accuracy.agreement_rate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#55606E]">High-confidence agreement</span>
                <span className="font-medium text-[#232E3D]">
                  {formatPercent(accuracy.high_confidence_agreement_rate)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#55606E]">Feedback samples</span>
                <span className="font-medium text-[#232E3D]">{accuracy.total_feedback}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#55606E]">Divergence threshold</span>
                <span className="font-medium text-[#232E3D]">
                  {accuracy.recommended_divergence_threshold ?? '—'}
                </span>
              </div>
              {accuracy.threshold_is_stale && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-xs text-yellow-800">
                  Calibration hasn&apos;t refreshed recently — analyst review throughput may have
                  dropped.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Live activity feed */}
      <div className="mt-6 bg-white rounded-lg border border-[#EDEFF0] p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-[#232E3D] text-sm">Live activity</h3>
          <span className="text-xs text-[#55606E] capitalize">{status}</span>
        </div>
        {events.length === 0 ? (
          <p className="text-sm text-[#55606E]">
            Waiting for activity — new reports and AI divergence alerts will appear here in real
            time.
          </p>
        ) : (
          <ul className="space-y-2 max-h-80 overflow-y-auto">
            {events.map((evt, i) => {
              const meta = streamEventMeta[evt.event] || {
                label: evt.event,
                color: 'text-[#55606E]',
                icon: '•',
              };
              return (
                <li
                  key={`${evt.report_id}-${i}`}
                  className="flex items-center justify-between text-sm border-b border-[#EDEFF0] last:border-0 pb-2 last:pb-0"
                >
                  <span className="flex items-center gap-2">
                    <span className={meta.color}>{meta.icon}</span>
                    <span className="text-[#232E3D]">{meta.label}</span>
                    {evt.review_priority && (
                      <span className="text-xs text-[#55606E] capitalize">({evt.review_priority})</span>
                    )}
                  </span>
                  {evt.report_id && (
                    <Link
                      href={`/analyst/reports/${evt.report_id}`}
                      className="text-xs text-[#006EB5] hover:underline flex-shrink-0 ml-2"
                    >
                      View
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}