'use client';

import { useEffect, useState } from 'react';
import { Gauge, MessageSquareText, ShieldCheck, Target } from 'lucide-react';
import { analystApi } from '@/lib/api';
import type { AIAccuracyResponse, AIFeedbackType } from '@/lib/types';
import { formatDate, formatPercent } from '@/lib/utils';
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
} from '@/components/analyst/ui';

const FEEDBACK_LABELS: Record<AIFeedbackType, string> = {
  verify: 'Verified reports',
  reject: 'Rejected reports',
  severity_override: 'Severity overrides',
};

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
    return <LoadingBlock />;
  }

  return (
    <PageContainer narrow>
      <PageHeader
        title={<>AI Accuracy &amp; Calibration</>}
        description={
          <>
            Tracks how often the vision model&apos;s severity prediction agrees with analyst decisions.
            The divergence-flagging threshold used by the AI worker adjusts automatically once enough
            high-confidence feedback has accumulated.
          </>
        }
      />

      {error && <Alert className="mb-4">{error}</Alert>}

      {!data || data.total_feedback === 0 ? (
        <div className="rounded-lg border border-[#EDEFF0] bg-white">
          <EmptyState icon={Gauge} title="No analyst feedback recorded yet">
            Every verify, reject, or severity override an analyst makes feeds this calibration loop —
            check back once the review queue has moved.
          </EmptyState>
        </div>
      ) : (
        <>
          <KeyFigureRow className="mb-5 grid-cols-2 lg:grid-cols-4">
            <KeyFigure icon={MessageSquareText} label="Total feedback" value={data.total_feedback.toLocaleString()} />
            <KeyFigure icon={Target} label="Overall agreement" value={formatPercent(data.agreement_rate)} />
            <KeyFigure
              icon={ShieldCheck}
              label="High-confidence agreement"
              value={formatPercent(data.high_confidence_agreement_rate)}
              sub={`${data.high_confidence_feedback_count} samples (conf > 0.7)`}
            />
            <KeyFigure icon={Gauge} label="Avg. AI confidence" value={formatPercent(data.avg_ai_confidence)} />
          </KeyFigureRow>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <Panel title="Agreement by feedback type">
              <div className="space-y-4">
                {(Object.keys(FEEDBACK_LABELS) as AIFeedbackType[]).map(type => {
                  const row = data.by_feedback_type[type];
                  const pct = row?.agreement_rate ?? null;
                  return (
                    <BarRow
                      key={type}
                      label={FEEDBACK_LABELS[type]}
                      value={`${row?.count ?? 0} · ${formatPercent(pct)}`}
                      percent={pct ? pct * 100 : 0}
                    />
                  );
                })}
              </div>
            </Panel>

            <Panel title="Divergence threshold">
              <DefinitionList
                rows={[
                  {
                    label: 'Currently applied',
                    value: data.recommended_divergence_threshold ?? 'Not yet calibrated',
                  },
                  { label: 'Minimum sample for recalibration', value: data.min_sample_for_calibration },
                  {
                    label: 'Last calibrated',
                    value: data.threshold_updated_at ? formatDate(data.threshold_updated_at) : '—',
                  },
                ]}
              />

              {data.threshold_is_stale && (
                <Alert tone="warning" className="mt-4 text-xs">
                  <strong>Stale calibration:</strong> the threshold hasn&apos;t refreshed recently.
                  This usually means analyst review throughput has slowed — the divergence flag may
                  no longer reflect current model behaviour.
                </Alert>
              )}

              {data.high_confidence_feedback_count < data.min_sample_for_calibration && (
                <Alert tone="info" className="mt-4 text-xs">
                  {data.min_sample_for_calibration - data.high_confidence_feedback_count} more
                  high-confidence feedback samples needed before the threshold can be recalibrated.
                </Alert>
              )}
            </Panel>
          </div>
        </>
      )}
    </PageContainer>
  );
}
