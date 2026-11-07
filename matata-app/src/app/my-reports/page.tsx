'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { reportsApi } from '@/lib/api';
import { getRole, getToken } from '@/lib/auth';
import { formatDate, statusColors, severityColors } from '@/lib/utils';
import { AccountMenu } from '@/components/layout/AccountMenu';
import type { Report, PaginatedOwnReports, Role } from '@/lib/types';
import { MatataIcon } from '@/components/layout/MatataIcon';
import { useLanguage } from '@/contexts/LanguageContext';
import { t, type Locale, type TranslationKey } from '@/lib/i18n';

const LIMIT = 20;

// Report values come from the API in English; show them in the reader's language.
const STATUS_KEYS: Record<string, TranslationKey> = {
  pending: 'status.received',
  verified: 'status.verified',
  rejected: 'status.rejected',
  duplicate: 'status.duplicate',
  pending_merge_review: 'status.pending_merge_review',
};
const SEVERITY_KEYS: Record<string, TranslationKey> = {
  minimal: 'report.severity_minimal_label',
  partial: 'report.severity_partial_label',
  destroyed: 'report.severity_destroyed_label',
};

function label(locale: Locale, key: string, map: Record<string, TranslationKey>): string {
  return map[key] ? t(locale, map[key]) : key.replace(/_/g, ' ');
}

/** Crisis and infrastructure types use `crisis.*` / `infra.*` keys named after the API value. */
function typeLabel(locale: Locale, prefix: 'crisis' | 'infra', value: string): string {
  const key = `${prefix}.${value}`;
  const text = t(locale, key as TranslationKey);
  return text === key ? value.replace(/_/g, ' ') : text;
}

export default function MyReportsPage() {
  const [data, setData] = useState<PaginatedOwnReports | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [role, setRole] = useState<Role | null>(null);
  const { locale } = useLanguage();

  useEffect(() => {
    setRole(getRole());
  }, []);

  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadFailed(false);
    reportsApi
      .list(page, LIMIT)
      .then(setData)
      .catch(() => setLoadFailed(true))
      .finally(() => setLoading(false));
  }, [page]);

  const totalPages = data ? Math.ceil(data.total / LIMIT) : 0;
  const isAnonymous = role === 'anonymous_reporter' || role === null;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="border-b border-[#EDEFF0]">
        <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <MatataIcon className="h-8 w-auto" />
            <span className="font-semibold text-[#232E3D]">Matata</span>
          </Link>
          <AccountMenu />
        </div>
      </div>

      <div className="max-w-xl mx-auto w-full px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#232E3D] mb-1">{t(locale, 'nav.my_reports')}</h1>
          <p className="text-sm text-[#55606E]">{t(locale, 'myreports.subtitle')}</p>
        </div>

        {isAnonymous && (
          <div className="bg-[#FBC412]/10 border border-[#FBC412]/30 rounded-lg p-4 text-sm text-[#232E3D]">
            {t(locale, 'myreports.anon_notice')}{' '}
            <Link href="/login" className="text-[#006EB5] hover:underline font-medium">
              {t(locale, 'myreports.anon_link')}
            </Link>{' '}
            {t(locale, 'myreports.anon_after')}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-6 h-6 border-2 border-[#006EB5] border-t-transparent rounded-full" />
          </div>
        ) : loadFailed ? (
          <p className="text-sm text-[#EE402D]">{t(locale, 'myreports.load_error')}</p>
        ) : !data?.items.length ? (
          <div className="text-center py-12">
            <p className="text-sm text-[#55606E] mb-4">
              {t(locale, 'myreports.empty')}
            </p>
            <Link
              href="/report"
              className="inline-flex items-center justify-center px-4 py-2.5 bg-[#006EB5] text-white text-sm font-medium rounded hover:bg-[#005a94] transition-colors"
            >
              {t(locale, 'myreports.submit')}
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
                    <div className="flex items-center gap-2">
                      {report.info_requested_at && !report.info_responded_at && (
                        <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold bg-[#FBC412]/20 text-[#232E3D] border border-[#FBC412]/60">
                          {t(locale, 'info.needed_badge')}
                        </span>
                      )}
                      <span
                        className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${statusColors[report.status]}`}
                      >
                        {label(locale, report.status, STATUS_KEYS)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#232E3D] capitalize">
                      {typeLabel(locale, 'crisis', report.crisis_type)} · {typeLabel(locale, 'infra', report.infrastructure_type)}
                    </span>
                    <span
                      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium capitalize ${severityColors[report.damage_severity]}`}
                    >
                      {label(locale, report.damage_severity, SEVERITY_KEYS)}
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
                  {t(locale, 'myreports.previous')}
                </button>
                <span className="text-xs text-[#55606E]">
                  {t(locale, 'myreports.page_of', { page, total: totalPages })}
                </span>
                <button
                  type="button"
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="text-sm text-[#006EB5] disabled:text-[#55606E] disabled:opacity-50"
                >
                  {t(locale, 'myreports.next')}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
