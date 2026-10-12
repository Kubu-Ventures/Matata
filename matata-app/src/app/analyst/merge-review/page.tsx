'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { CircleCheck } from 'lucide-react';
import { analystApi } from '@/lib/api';
import type { ReportListItem } from '@/lib/types';
import { formatDate, severityColors, crisisLabels } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Alert, Chip, EmptyState, LoadingBlock, PageContainer, PageHeader } from '@/components/analyst/ui';

export default function MergeReviewPage() {
  const [items, setItems] = useState<ReportListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actingId, setActingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await analystApi.listReports({
        status: 'pending_merge_review',
        limit: 100,
        sort_by: 'created_at',
      });
      setItems(result.items);
    } catch {
      setError('Could not load the merge review queue.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleConfirm(id: string) {
    setActingId(id);
    try {
      await analystApi.confirmMerge(id);
      setItems(prev => prev.filter(r => r.id !== id));
    } catch {
      setError('Could not confirm this merge. It may have already been actioned.');
    } finally {
      setActingId(null);
    }
  }

  async function handleReject(id: string) {
    setActingId(id);
    try {
      await analystApi.rejectMerge(id);
      setItems(prev => prev.filter(r => r.id !== id));
    } catch {
      setError('Could not reject this merge. It may have already been actioned.');
    } finally {
      setActingId(null);
    }
  }

  return (
    <PageContainer narrow>
      <PageHeader
        title="Merge Review Queue"
        description={
          <>
            These reports scored ≥ 0.9 against an existing report on the duplicate-detection composite
            (building, GPS proximity, image similarity, and category agreement). Confirm to merge, or
            reject to return the report to normal review as an independent incident.
          </>
        }
        meta={!loading && <span>{items.length} awaiting review</span>}
      />

      {error && <Alert className="mb-4">{error}</Alert>}

      {loading ? (
        <LoadingBlock />
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-[#EDEFF0] bg-white">
          <EmptyState icon={CircleCheck} title="No pending merges. The queue is clear." />
        </div>
      ) : (
        <ul className="divide-y divide-[#EDEFF0] overflow-hidden rounded-lg border border-[#EDEFF0] bg-white">
          {items.map(report => (
            <li key={report.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 p-4 sm:px-5">
              <div className="min-w-0">
                <div className="mb-1.5 flex flex-wrap items-center gap-2">
                  <Chip className={severityColors[report.damage_severity]}>{report.damage_severity}</Chip>
                  <span className="text-sm font-medium capitalize text-[#232E3D]">
                    {crisisLabels[report.crisis_type] || report.crisis_type} ·{' '}
                    {report.infrastructure_type}
                  </span>
                </div>
                <p className="text-xs text-[#55606E]">
                  <Link
                    href={`/analyst/reports/${report.id}`}
                    className="font-mono font-medium text-[#006EB5] hover:underline"
                  >
                    {report.id.slice(0, 8).toUpperCase()}
                  </Link>
                  {' · '}Submitted {formatDate(report.created_at)}
                </p>
              </div>

              <div className="flex w-full flex-shrink-0 gap-2 sm:w-auto">
                <Button
                  size="sm"
                  variant="secondary"
                  className="flex-1 sm:flex-none"
                  disabled={actingId === report.id}
                  loading={actingId === report.id}
                  onClick={() => handleReject(report.id)}
                >
                  Reject — keep separate
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  className="flex-1 sm:flex-none"
                  disabled={actingId === report.id}
                  loading={actingId === report.id}
                  onClick={() => handleConfirm(report.id)}
                >
                  Confirm merge
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </PageContainer>
  );
}
