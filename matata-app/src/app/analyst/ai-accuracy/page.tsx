'use client';

import { useEffect, useState } from 'react';
import { analystApi } from '@/lib/api';
import type { AIAccuracyResponse, AIFeedbackType } from '@/lib/types';
import { formatDate, formatPercent } from '@/lib/utils';

const FEEDBACK_LABELS: Record<AIFeedbackType, string> = {
  verify: 'Verified reports',
  reject: 'Rejected reports',
  severity_override: 'Severity overrides',
};

function MetricCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-lg border border-[#EDEFF0] p-5">
      <p className="text-xs text-[#55606E] uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-[#232E3D] mt-1">{value}</p>
      {sub && <p className="text-xs text-[#55606E] mt-1">{sub}</p>}
    </div>
  );
}

export default function AIAccuracyPage() {
  const [data, setData] = useState<AIAccuracyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    analystApi
      .getAIAccuracy()
      .then(setData)
      .catch(() => setError('Could not load AI accuracy metrics.'))
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
    <div className="p-6 max-w-4xl">
      <h1 className="text-xl font-bold text-[#232E3D] mb-1">AI Accuracy &amp; Calibration</h1>
      <p className="text-sm text-[#55606E] mb-6">
        Tracks how often the vision model&apos;s severity prediction agrees with analyst decisions.
        The divergence-flagging threshold used by the AI worker adjusts automatically once enough
        high-confidence feedback has accumulated.
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
          <p className="text-sm text-[#EE402D]">{error}</p>
        </div>
      )}

      {!data || data.total_feedback === 0 ? (
        <div className="bg-white rounded-lg border border-[#EDEFF0] py-16 text-center px-6">
          <p className="text-sm text-[#55606E]">
            No analyst feedback recorded yet. Every verify, reject, or severity override an analyst
            makes feeds this calibration loop — check back once the review queue has moved.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <MetricCard label="Total feedback" value={data.total_feedback.toLocaleString()} />
            <MetricCard label="Overall agreement" value={formatPercent(data.agreement_rate)} />
            <MetricCard
              label="High-confidence agreement"
              value={formatPercent(data.high_confidence_agreement_rate)}
              sub={`${data.high_confidence_feedback_count} samples (conf > 0.7)`}
            />
            <MetricCard label="Avg. AI confidence" value={formatPercent(data.avg_ai_confidence)} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border border-[#EDEFF0] p-5">
              <h3 className="font-medium text-[#232E3D] mb-4 text-sm">Agreement by feedback type</h3>
              <div className="space-y-4">
                {(Object.keys(FEEDBACK_LABELS) as AIFeedbackType[]).map(type => {
                  const row = data.by_feedback_type[type];
                  const pct = row?.agreement_rate ?? null;
                  return (
                    <div key={type}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-[#232E3D] font-medium">{FEEDBACK_LABELS[type]}</span>
                        <span className="text-[#55606E]">
                          {row?.count ?? 0} · {formatPercent(pct)}
                        </span>
                      </div>
                      <div className="h-2 bg-[#F7F8FA] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#006EB5] rounded-full"
                          style={{ width: `${pct ? pct * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-lg border border-[#EDEFF0] p-5">
              <h3 className="font-medium text-[#232E3D] mb-4 text-sm">Divergence threshold</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#55606E]">Currently applied</span>
                  <span className="font-medium text-[#232E3D]">
                    {data.recommended_divergence_threshold ?? 'Not yet calibrated'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#55606E]">Minimum sample for recalibration</span>
                  <span className="font-medium text-[#232E3D]">{data.min_sample_for_calibration}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#55606E]">Last calibrated</span>
                  <span className="font-medium text-[#232E3D]">
                    {data.threshold_updated_at ? formatDate(data.threshold_updated_at) : '—'}
                  </span>
                </div>
              </div>

              {data.threshold_is_stale && (
                <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded p-3">
                  <p className="text-xs text-yellow-800">
                    <strong>Stale calibration:</strong> the threshold hasn&apos;t refreshed recently.
                    This usually means analyst review throughput has slowed — the divergence flag may
                    no longer reflect current model behaviour.
                  </p>
                </div>
              )}

              {data.high_confidence_feedback_count < data.min_sample_for_calibration && (
                <div className="mt-4 bg-[#B5D5F5]/20 border border-[#B5D5F5] rounded p-3">
                  <p className="text-xs text-[#232E3D]">
                    {data.min_sample_for_calibration - data.high_confidence_feedback_count} more
                    high-confidence feedback samples needed before the threshold can be recalibrated.
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
