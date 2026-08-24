'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { analystApi } from '@/lib/api';
import type { ReportListItem } from '@/lib/types';
import { formatDate, severityColors, crisisLabels } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

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
    <div className="p-6 max-w-4xl">
      <h1 className="text-xl font-bold text-[#232E3D] mb-1">Merge Review Queue</h1>
      <p className="text-sm text-[#55606E] mb-6">
        These reports scored ≥ 0.9 against an existing report on the duplicate-detection composite
        (building, GPS proximity, image similarity, and category agreement). Confirm to merge, or
        reject to return the report to normal review as an independent incident.
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
          <p className="text-sm text-[#EE402D]">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center">
          <div className="inline-block animate-spin w-6 h-6 border-2 border-[#006EB5] border-t-transparent rounded-full" />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-lg border border-[#EDEFF0] py-16 text-center">
          <p className="text-sm text-[#55606E]">No pending merges. The queue is clear.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(report => (
            <div key={report.id} className="bg-white rounded-lg border border-[#EDEFF0] p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <span
                      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium capitalize ${severityColors[report.damage_severity]}`}
                    >
                      {report.damage_severity}
                    </span>
                    <span className="text-xs text-[#55606E] capitalize">
                      {crisisLabels[report.crisis_type] || report.crisis_type} ·{' '}
                      {report.infrastructure_type}
                    </span>
                  </div>
                  <Link
                    href={`/analyst/reports/${report.id}`}
                    className="text-sm font-mono text-[#006EB5] hover:underline"
                  >
                    {report.id.slice(0, 8).toUpperCase()}
                  </Link>
                  <p className="text-xs text-[#55606E] mt-1">Submitted {formatDate(report.created_at)}</p>
                </div>

                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={actingId === report.id}
                    loading={actingId === report.id}
                    onClick={() => handleReject(report.id)}
                  >
                    Reject — keep separate
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    disabled={actingId === report.id}
                    loading={actingId === report.id}
                    onClick={() => handleConfirm(report.id)}
                  >
                    Confirm merge
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
