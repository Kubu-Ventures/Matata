'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { reportsApi } from '@/lib/api';
import { getRole, getToken } from '@/lib/auth';
import { formatDate, statusColors, severityColors } from '@/lib/utils';
import { AccountMenu } from '@/components/layout/AccountMenu';
import type { Report, PaginatedOwnReports, Role } from '@/lib/types';

const LIMIT = 20;

export default function MyReportsPage() {
  const [data, setData] = useState<PaginatedOwnReports | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [role, setRole] = useState<Role | null>(null);

  useEffect(() => {
    setRole(getRole());
  }, []);

  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    reportsApi
      .list(page, LIMIT)
      .then(setData)
      .catch(() => setError('Could not load your reports.'))
      .finally(() => setLoading(false));
  }, [page]);

  const totalPages = data ? Math.ceil(data.total / LIMIT) : 0;
  const isAnonymous = role === 'anonymous_reporter' || role === null;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="border-b border-[#EDEFF0]">
        <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#006EB5] rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">M</span>
            </div>
            <span className="font-semibold text-[#232E3D]">Matata</span>
          </Link>
          <AccountMenu />
        </div>
      </div>

      <div className="max-w-xl mx-auto w-full px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#232E3D] mb-1">My Reports</h1>
          <p className="text-sm text-[#55606E]">Reports you&apos;ve submitted, newest first.</p>
        </div>

        {isAnonymous && (
          <div className="bg-[#FBC412]/10 border border-[#FBC412]/30 rounded-lg p-4 text-sm text-[#232E3D]">
            You&apos;re reporting anonymously. This list only shows reports from your
            current session and will reset once it expires.{' '}
            <Link href="/login" className="text-[#006EB5] hover:underline font-medium">
              Sign in with your phone number
            </Link>{' '}
            to keep permanent access to your report history.
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-6 h-6 border-2 border-[#006EB5] border-t-transparent rounded-full" />
          </div>
        ) : error ? (
          <p className="text-sm text-[#EE402D]">{error}</p>
        ) : !data?.items.length ? (
          <div className="text-center py-12">
            <p className="text-sm text-[#55606E] mb-4">
              You haven&apos;t submitted any reports yet.
            </p>
            <Link
              href="/report"
              className="inline-flex items-center justify-center px-4 py-2.5 bg-[#006EB5] text-white text-sm font-medium rounded hover:bg-[#005a94] transition-colors"
            >
              Submit a report
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {data.items.map((report: Report) => (
                <Link
                  key={report.id}
                  href={`/report/${report.id}`}
                  className="block border border-[#EDEFF0] rounded-lg p-4 hover:border-[#B5D5F5] transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs text-[#55606E]">
                      {report.id.slice(0, 8).toUpperCase()}
                    </span>
                    <span
                      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${statusColors[report.status]}`}
                    >
                      {report.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#232E3D] capitalize">
                      {report.crisis_type} · {report.infrastructure_type}
                    </span>
                    <span
                      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium capitalize ${severityColors[report.damage_severity]}`}
                    >
                      {report.damage_severity}
                    </span>
                  </div>
                  <p className="text-xs text-[#55606E] mt-2">{formatDate(report.created_at)}</p>
                </Link>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="text-sm text-[#006EB5] disabled:text-[#55606E] disabled:opacity-50"
                >
                  ← Previous
                </button>
                <span className="text-xs text-[#55606E]">
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="text-sm text-[#006EB5] disabled:text-[#55606E] disabled:opacity-50"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
