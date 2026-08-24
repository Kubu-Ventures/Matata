'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { analystApi } from '@/lib/api';
import type { PaginatedReports, ReportListItem } from '@/lib/types';
import { formatDate, severityColors, statusColors, priorityColors, infraLabels } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { useAnalystStreamContext } from '@/contexts/AnalystStreamContext';

const LIMIT = 50;

const EMPTY_FILTERS = {
  status: '',
  crisis_type: '',
  infrastructure_type: '',
  damage_severity: '',
  review_priority: '',
  sort_by: '',
  time_from: '',
  time_to: '',
  min_ai_confidence: '',
  divergence_only: false,
};

export default function AnalystDashboardPage() {
  const [data, setData] = useState<PaginatedReports | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { version: streamVersion, status: streamStatus } = useAnalystStreamContext();
  const [hasNewActivity, setHasNewActivity] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number | boolean> = { page, limit: LIMIT };
      if (filters.status) params.status = filters.status;
      if (filters.crisis_type) params.crisis_type = filters.crisis_type;
      if (filters.infrastructure_type) params.infrastructure_type = filters.infrastructure_type;
      if (filters.damage_severity) params.damage_severity = filters.damage_severity;
      if (filters.review_priority) params.review_priority = filters.review_priority;
      if (filters.sort_by) params.sort_by = filters.sort_by;
      if (filters.time_from) params.time_from = new Date(filters.time_from).toISOString();
      if (filters.time_to) params.time_to = new Date(filters.time_to).toISOString();
      if (filters.min_ai_confidence) params.min_ai_confidence = Number(filters.min_ai_confidence);
      if (filters.divergence_only) params.divergence_only = true;
      const result = await analystApi.listReports(params);
      setData(result);
      setHasNewActivity(false);
    } catch {}
    setLoading(false);
  }, [page, filters]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filters]);

  // Don't auto-refetch on every SSE tick (would yank the list from under an
  // analyst mid-review) — just surface a soft "new activity" affordance.
  useEffect(() => {
    if (streamVersion > 0) setHasNewActivity(true);
  }, [streamVersion]);

  function setFilter<K extends keyof typeof EMPTY_FILTERS>(key: K, val: (typeof EMPTY_FILTERS)[K]) {
    setFilters(prev => ({ ...prev, [key]: val }));
    setPage(1);
  }

  const activeFilterCount = Object.entries(filters).filter(([, v]) =>
    typeof v === 'boolean' ? v : Boolean(v)
  ).length;

  const totalPages = data ? Math.ceil(data.total / LIMIT) : 0;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-[#232E3D]">Damage Reports</h1>
          {data && (
            <p className="text-sm text-[#55606E] mt-0.5">
              {data.total.toLocaleString()} total reports
            </p>
          )}
        </div>
        <Link
          href="/analyst/export"
          className="px-3 py-1.5 text-sm text-[#006EB5] border border-[#006EB5] rounded hover:bg-[#006EB5] hover:text-white transition-colors"
        >
          Export data
        </Link>
      </div>

      {hasNewActivity && streamStatus === 'live' && (
        <button
          onClick={load}
          className="w-full mb-4 flex items-center justify-center gap-2 py-2 bg-[#006EB5]/5 border border-[#B5D5F5] rounded-md text-sm text-[#006EB5] font-medium hover:bg-[#006EB5]/10 transition-colors"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#006EB5] animate-pulse" />
          New activity — refresh list
        </button>
      )}

      {/* Filters */}
      <div className="mb-6 p-4 bg-white rounded-lg border border-[#EDEFF0]">
        <div className="flex flex-wrap gap-3">
          <Select
            options={[
              { value: 'pending', label: 'Pending' },
              { value: 'verified', label: 'Verified' },
              { value: 'rejected', label: 'Rejected' },
              { value: 'duplicate', label: 'Duplicate' },
              { value: 'pending_merge_review', label: 'Merge Review' },
            ]}
            placeholder="All statuses"
            value={filters.status}
            onChange={e => setFilter('status', e.target.value)}
            className="min-w-[140px]"
          />
          <Select
            options={[
              { value: 'flood', label: 'Flood' },
              { value: 'earthquake', label: 'Earthquake' },
              { value: 'conflict', label: 'Conflict' },
              { value: 'wildfire', label: 'Wildfire' },
              { value: 'other', label: 'Other' },
            ]}
            placeholder="All crises"
            value={filters.crisis_type}
            onChange={e => setFilter('crisis_type', e.target.value)}
            className="min-w-[120px]"
          />
          <Select
            options={[
              { value: 'residential', label: infraLabels.residential },
              { value: 'commercial', label: infraLabels.commercial },
              { value: 'government', label: infraLabels.government },
              { value: 'utilities', label: infraLabels.utilities },
              { value: 'transport', label: infraLabels.transport },
              { value: 'community', label: infraLabels.community },
            ]}
            placeholder="All infrastructure"
            value={filters.infrastructure_type}
            onChange={e => setFilter('infrastructure_type', e.target.value)}
            className="min-w-[150px]"
          />
          <Select
            options={[
              { value: 'minimal', label: 'Minimal' },
              { value: 'partial', label: 'Partial' },
              { value: 'destroyed', label: 'Destroyed' },
            ]}
            placeholder="All severities"
            value={filters.damage_severity}
            onChange={e => setFilter('damage_severity', e.target.value)}
            className="min-w-[130px]"
          />
          <Select
            options={[
              { value: 'critical', label: 'Critical priority' },
              { value: 'high', label: 'High priority' },
              { value: 'normal', label: 'Normal priority' },
              { value: 'low', label: 'Low priority' },
            ]}
            placeholder="All priorities"
            value={filters.review_priority}
            onChange={e => setFilter('review_priority', e.target.value)}
            className="min-w-[140px]"
          />
          <Select
            options={[
              { value: '', label: 'Priority-first (default)' },
              { value: 'severity', label: 'Severity-first' },
              { value: 'created_at', label: 'Newest first' },
            ]}
            value={filters.sort_by}
            onChange={e => setFilter('sort_by', e.target.value)}
            className="min-w-[170px]"
          />
          <Button variant="ghost" size="sm" onClick={() => setShowAdvanced(v => !v)}>
            {showAdvanced ? 'Hide' : 'More filters'}
          </Button>
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setFilters(EMPTY_FILTERS)}>
              Clear filters
            </Button>
          )}
        </div>

        {showAdvanced && (
          <div className="flex flex-wrap items-end gap-3 mt-3 pt-3 border-t border-[#EDEFF0]">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-[#55606E]">From</span>
              <input
                type="date"
                value={filters.time_from}
                onChange={e => setFilter('time_from', e.target.value)}
                className="rounded border border-[#EDEFF0] px-2.5 py-1.5 text-sm focus:border-[#006EB5] focus:outline-none focus:ring-1 focus:ring-[#006EB5]"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-[#55606E]">To</span>
              <input
                type="date"
                value={filters.time_to}
                onChange={e => setFilter('time_to', e.target.value)}
                className="rounded border border-[#EDEFF0] px-2.5 py-1.5 text-sm focus:border-[#006EB5] focus:outline-none focus:ring-1 focus:ring-[#006EB5]"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-[#55606E]">Min. AI confidence</span>
              <input
                type="number"
                min={0}
                max={1}
                step={0.1}
                placeholder="0.0–1.0"
                value={filters.min_ai_confidence}
                onChange={e => setFilter('min_ai_confidence', e.target.value)}
                className="w-28 rounded border border-[#EDEFF0] px-2.5 py-1.5 text-sm focus:border-[#006EB5] focus:outline-none focus:ring-1 focus:ring-[#006EB5]"
              />
            </label>
            <label className="flex items-center gap-2 pb-1.5">
              <input
                type="checkbox"
                checked={filters.divergence_only}
                onChange={e => setFilter('divergence_only', e.target.checked)}
                className="rounded border-[#EDEFF0] text-[#006EB5] focus:ring-[#006EB5]"
              />
              <span className="text-sm text-[#232E3D]">AI divergence only</span>
            </label>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-[#EDEFF0] overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <div className="inline-block animate-spin w-6 h-6 border-2 border-[#006EB5] border-t-transparent rounded-full" />
          </div>
        ) : !data?.items.length ? (
          <div className="py-16 text-center text-sm text-[#55606E]">No reports found</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#EDEFF0] bg-[#F7F8FA]">
                    <th className="text-left px-4 py-3 font-medium text-[#55606E]">Priority</th>
                    <th className="text-left px-4 py-3 font-medium text-[#55606E]">ID</th>
                    <th className="text-left px-4 py-3 font-medium text-[#55606E]">Crisis</th>
                    <th className="text-left px-4 py-3 font-medium text-[#55606E]">Severity</th>
                    <th className="text-left px-4 py-3 font-medium text-[#55606E]">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-[#55606E]">Submitted</th>
                    <th className="text-left px-4 py-3 font-medium text-[#55606E]">AI Conf.</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((report: ReportListItem) => (
                    <tr
                      key={report.id}
                      className="border-b border-[#EDEFF0] hover:bg-[#F7F8FA] transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium capitalize ${priorityColors[report.review_priority] || ''}`}
                        >
                          {report.review_priority}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/analyst/reports/${report.id}`}
                          className="text-[#006EB5] hover:underline font-mono text-xs"
                        >
                          {report.id.slice(0, 8)}
                        </Link>
                      </td>
                      <td className="px-4 py-3 capitalize text-[#232E3D]">
                        {report.crisis_type} / {report.infrastructure_type}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium capitalize ${severityColors[report.damage_severity]}`}
                        >
                          {report.damage_severity}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium capitalize ${statusColors[report.status]}`}
                        >
                          {report.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#55606E] whitespace-nowrap">
                        {formatDate(report.created_at)}
                      </td>
                      <td className="px-4 py-3 text-[#55606E]">
                        {report.ai_confidence !== null
                          ? `${Math.round((report.ai_confidence || 0) * 100)}%`
                          : '—'}
                        {report.ai_divergence && (
                          <span
                            title="AI disagrees with reporter severity"
                            className="ml-1 text-[#FBC412]"
                          >
                            ⚠
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-[#EDEFF0]">
                <p className="text-xs text-[#55606E]">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page === totalPages}
                    onClick={() => setPage(p => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
