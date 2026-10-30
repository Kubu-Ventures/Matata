'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Download, Inbox, SlidersHorizontal, TriangleAlert, X } from 'lucide-react';
import { analystApi } from '@/lib/api';
import type { PaginatedReports, ReportListItem } from '@/lib/types';
import { formatDate, severityColors, statusColors, priorityColors, infraLabels } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { useAnalystStreamContext } from '@/contexts/AnalystStreamContext';
import {
  Chip,
  EmptyState,
  LoadingBlock,
  PageContainer,
  PageHeader,
  SelectField,
  checkboxClass,
  fieldInputClass,
  fieldLabelClass,
} from '@/components/analyst/ui';

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

function AiConfidence({ report }: { report: ReportListItem }) {
  return (
    <span className="inline-flex items-center gap-1 tabular-nums">
      {report.ai_confidence !== null ? `${Math.round((report.ai_confidence || 0) * 100)}%` : '—'}
      {report.ai_divergence && (
        <span title="AI disagrees with reporter severity" className="text-[#FBC412]">
          <TriangleAlert className="h-3.5 w-3.5" aria-label="AI disagrees with reporter severity" />
        </span>
      )}
    </span>
  );
}

function InfoBadges({ report }: { report: ReportListItem }) {
  return (
    <>
      {report.medical_help_needed === 'urgent' && (
        <Chip className="border border-red-200 bg-red-50 normal-case text-red-700">Medical help</Chip>
      )}
      {report.info_responded_at ? (
        <Chip className="border border-[#B5D5F5] bg-[#B5D5F5]/30 normal-case text-[#006EB5]">Reply received</Chip>
      ) : report.info_requested_at ? (
        <Chip className="border border-[#FBC412]/60 bg-[#FBC412]/10 normal-case text-[#232E3D]">Waiting for reply</Chip>
      ) : null}
      {report.field_reporter_code && (
        <Chip className="border border-[#EDEFF0] bg-white font-mono normal-case text-[#232E3D]">
          {report.field_reporter_code}
        </Chip>
      )}
    </>
  );
}

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
  const firstRow = data && data.items.length ? (page - 1) * LIMIT + 1 : 0;
  const lastRow = data ? firstRow + data.items.length - 1 : 0;

  return (
    <PageContainer>
      <PageHeader
        title="Damage Reports"
        meta={data && <span>{data.total.toLocaleString()} total reports</span>}
        actions={
          <Link
            href="/analyst/export"
            className="inline-flex items-center gap-1.5 rounded-md border border-[#006EB5] px-3 py-1.5 text-sm font-medium text-[#006EB5] transition-colors hover:bg-[#006EB5] hover:text-white"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Export data
          </Link>
        }
      />

      {hasNewActivity && streamStatus === 'live' && (
        <button
          onClick={load}
          className="mb-4 flex w-full items-center justify-center gap-2 rounded-md border border-[#B5D5F5] bg-[#006EB5]/5 py-2 text-sm font-medium text-[#006EB5] transition-colors hover:bg-[#006EB5]/10"
        >
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#006EB5]" />
          New activity — refresh list
        </button>
      )}

      {/* Filters */}
      <section aria-label="Filters" className="mb-5 rounded-lg border border-[#EDEFF0] bg-white p-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <SelectField
            label="Status"
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
          />
          <SelectField
            label="Crisis"
            options={[
              { value: 'flood', label: 'Flood' },
              { value: 'earthquake', label: 'Earthquake' },
              { value: 'conflict', label: 'Conflict' },
              { value: 'fire', label: 'Fire' },
              { value: 'wildfire', label: 'Wildfire' },
              { value: 'other', label: 'Other' },
            ]}
            placeholder="All crises"
            value={filters.crisis_type}
            onChange={e => setFilter('crisis_type', e.target.value)}
          />
          <SelectField
            label="Infrastructure"
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
          />
          <SelectField
            label="Severity"
            options={[
              { value: 'minimal', label: 'Minimal' },
              { value: 'partial', label: 'Partial' },
              { value: 'destroyed', label: 'Destroyed' },
            ]}
            placeholder="All severities"
            value={filters.damage_severity}
            onChange={e => setFilter('damage_severity', e.target.value)}
          />
          <SelectField
            label="Priority"
            options={[
              { value: 'critical', label: 'Critical priority' },
              { value: 'high', label: 'High priority' },
              { value: 'normal', label: 'Normal priority' },
              { value: 'low', label: 'Low priority' },
            ]}
            placeholder="All priorities"
            value={filters.review_priority}
            onChange={e => setFilter('review_priority', e.target.value)}
          />
          <SelectField
            label="Sort by"
            options={[
              { value: '', label: 'Priority-first (default)' },
              { value: 'severity', label: 'Severity-first' },
              { value: 'created_at', label: 'Newest first' },
            ]}
            value={filters.sort_by}
            onChange={e => setFilter('sort_by', e.target.value)}
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-1 gap-y-2">
          <Button variant="ghost" size="sm" onClick={() => setShowAdvanced(v => !v)} aria-expanded={showAdvanced}>
            <SlidersHorizontal className="mr-1.5 h-4 w-4" aria-hidden="true" />
            {showAdvanced ? 'Hide' : 'More filters'}
          </Button>
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setFilters(EMPTY_FILTERS)}>
              <X className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Clear filters
            </Button>
          )}
          {activeFilterCount > 0 && (
            <span className="ml-auto text-xs text-[#55606E]">
              {activeFilterCount} filter{activeFilterCount === 1 ? '' : 's'} applied
            </span>
          )}
        </div>

        {showAdvanced && (
          <div className="mt-3 grid grid-cols-2 items-end gap-3 border-t border-[#EDEFF0] pt-3 md:grid-cols-3 xl:grid-cols-6">
            <label className="block font-normal">
              <span className={fieldLabelClass}>From</span>
              <input
                type="date"
                value={filters.time_from}
                onChange={e => setFilter('time_from', e.target.value)}
                className={fieldInputClass}
              />
            </label>
            <label className="block font-normal">
              <span className={fieldLabelClass}>To</span>
              <input
                type="date"
                value={filters.time_to}
                onChange={e => setFilter('time_to', e.target.value)}
                className={fieldInputClass}
              />
            </label>
            <label className="block font-normal">
              <span className={fieldLabelClass}>Min. AI confidence</span>
              <input
                type="number"
                min={0}
                max={1}
                step={0.1}
                placeholder="0.0–1.0"
                value={filters.min_ai_confidence}
                onChange={e => setFilter('min_ai_confidence', e.target.value)}
                className={fieldInputClass}
              />
            </label>
            <label className="col-span-2 flex h-9 items-center gap-2 font-normal md:col-span-1 xl:col-span-2">
              <input
                type="checkbox"
                checked={filters.divergence_only}
                onChange={e => setFilter('divergence_only', e.target.checked)}
                className={checkboxClass}
              />
              <span className="text-sm text-[#232E3D]">AI divergence only</span>
            </label>
          </div>
        )}
      </section>

      {/* Results */}
      <div className="overflow-hidden rounded-lg border border-[#EDEFF0] bg-white">
        {loading ? (
          <LoadingBlock />
        ) : !data?.items.length ? (
          <EmptyState icon={Inbox} title="No reports found">
            {activeFilterCount > 0 ? 'Try clearing a filter to widen the list.' : undefined}
          </EmptyState>
        ) : (
          <>
            {/* Table — laptops and up */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#EDEFF0] bg-[#F7F8FA] text-left text-xs uppercase tracking-wide text-[#55606E]">
                    <th className="px-4 py-2.5 font-medium">Priority</th>
                    <th className="px-4 py-2.5 font-medium">ID</th>
                    <th className="px-4 py-2.5 font-medium">Crisis</th>
                    <th className="px-4 py-2.5 font-medium">Severity</th>
                    <th className="px-4 py-2.5 font-medium">Status</th>
                    <th className="px-4 py-2.5 font-medium">Submitted</th>
                    <th className="px-4 py-2.5 font-medium">AI Conf.</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((report: ReportListItem) => (
                    <tr
                      key={report.id}
                      className="border-b border-[#EDEFF0] transition-colors last:border-0 hover:bg-[#F7F8FA]"
                    >
                      <td className="px-4 py-3">
                        <Chip className={`border ${priorityColors[report.review_priority] || ''}`}>
                          {report.review_priority}
                        </Chip>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/analyst/reports/${report.id}`}
                          className="font-mono text-xs font-medium text-[#006EB5] hover:underline"
                        >
                          {report.id.slice(0, 8)}
                        </Link>
                      </td>
                      <td className="px-4 py-3 capitalize text-[#232E3D]">
                        {report.crisis_type} / {report.infrastructure_type}
                      </td>
                      <td className="px-4 py-3">
                        <Chip className={severityColors[report.damage_severity]}>{report.damage_severity}</Chip>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          <Chip className={statusColors[report.status]}>{report.status.replace(/_/g, ' ')}</Chip>
                          <InfoBadges report={report} />
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-[#55606E]">{formatDate(report.created_at)}</td>
                      <td className="px-4 py-3 text-[#55606E]">
                        <AiConfidence report={report} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cards — phones and tablets */}
            <ul className="divide-y divide-[#EDEFF0] lg:hidden">
              {data.items.map((report: ReportListItem) => (
                <li key={report.id}>
                  <Link
                    href={`/analyst/reports/${report.id}`}
                    className="block px-4 py-3 font-normal transition-colors hover:bg-[#F7F8FA]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="min-w-0 text-sm font-semibold capitalize text-[#232E3D]">
                        {report.crisis_type} / {report.infrastructure_type}
                      </p>
                      <span className="flex-shrink-0 font-mono text-xs font-medium text-[#006EB5]">
                        {report.id.slice(0, 8)}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <Chip className={`border ${priorityColors[report.review_priority] || ''}`}>
                        {report.review_priority}
                      </Chip>
                      <Chip className={severityColors[report.damage_severity]}>{report.damage_severity}</Chip>
                      <Chip className={statusColors[report.status]}>{report.status.replace(/_/g, ' ')}</Chip>
                      <InfoBadges report={report} />
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3 text-xs text-[#55606E]">
                      <span>{formatDate(report.created_at)}</span>
                      <span className="inline-flex items-center gap-1">
                        AI <AiConfidence report={report} />
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#EDEFF0] px-4 py-3">
              <p className="text-xs text-[#55606E]">
                Showing {firstRow.toLocaleString()}–{lastRow.toLocaleString()} of {data.total.toLocaleString()}
                {totalPages > 1 && (
                  <>
                    {' · '}Page {page} of {totalPages}
                  </>
                )}
              </p>
              {totalPages > 1 && (
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                    <ChevronLeft className="-ml-1 mr-1 h-4 w-4" aria-hidden="true" />
                    Previous
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page === totalPages}
                    onClick={() => setPage(p => p + 1)}
                  >
                    Next
                    <ChevronRight className="-mr-1 ml-1 h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </PageContainer>
  );
}
