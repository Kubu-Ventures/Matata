'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { analystApi } from '@/lib/api';
import type { PaginatedReports, ReportListItem } from '@/lib/types';
import { formatDate, severityColors, statusColors, priorityColors } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';

const LIMIT = 50;

export default function AnalystDashboardPage() {
  const [data, setData] = useState<PaginatedReports | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    crisis_type: '',
    damage_severity: '',
    review_priority: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: LIMIT };
      if (filters.status) params.status = filters.status;
      if (filters.crisis_type) params.crisis_type = filters.crisis_type;
      if (filters.damage_severity) params.damage_severity = filters.damage_severity;
      if (filters.review_priority) params.review_priority = filters.review_priority;
      const result = await analystApi.listReports(params);
      setData(result);
    } catch {}
    setLoading(false);
  }, [page, filters]);

  useEffect(() => {
    load();
  }, [load]);

  function setFilter(key: string, val: string) {
    setFilters(prev => ({ ...prev, [key]: val }));
    setPage(1);
  }

  const totalPages = data ? Math.ceil(data.total / LIMIT) : 0;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
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

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6 p-4 bg-white rounded-lg border border-[#EDEFF0]">
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
        {Object.values(filters).some(Boolean) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              setFilters({ status: '', crisis_type: '', damage_severity: '', review_priority: '' })
            }
          >
            Clear filters
          </Button>
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
