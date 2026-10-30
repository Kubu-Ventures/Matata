'use client';

import { use, useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { reportsApi } from '@/lib/api';
import { getRole } from '@/lib/auth';
import type { Report } from '@/lib/types';
import { formatDate, statusColors } from '@/lib/utils';
import { MatataIcon } from '@/components/layout/MatataIcon';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/lib/i18n';
import { compressPhoto } from '@/lib/image';

const STATUS_MESSAGES: Record<string, { title: string; desc: string; icon: string }> = {
  pending: {
    title: 'Report received',
    desc: 'Your report is in the analyst queue and will be reviewed shortly.',
    icon: '⏳',
  },
  verified: {
    title: 'Report verified',
    desc: 'A field analyst has confirmed your report. Thank you for helping.',
    icon: '✅',
  },
  rejected: {
    title: 'Report reviewed',
    desc: 'This report was not actioned. It may be a duplicate or outside scope.',
    icon: 'ℹ️',
  },
  duplicate: {
    title: 'Duplicate report',
    desc: 'This report matches an existing submission that has already been logged.',
    icon: '🔁',
  },
  pending_merge_review: {
    title: 'Under review',
    desc: 'This report is being compared with nearby submissions.',
    icon: '🔍',
  },
};

/** The analyst's question and the reporter's answer. Shows a reply form
 *  while the question is open; the original report is never edited. */
function InfoRequestPanel({ report, onUpdated }: { report: Report; onUpdated: (r: Report) => void }) {
  const { locale } = useLanguage();
  const [text, setText] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const open = !report.info_responded_at;

  async function send() {
    if (!text.trim()) return;
    setSending(true);
    setError('');
    try {
      if (photo) {
        const fd = new FormData();
        const compressed = await compressPhoto(photo).catch(() => photo);
        fd.append('photo', compressed, 'photo.jpg');
        await reportsApi.uploadPhoto(report.id, fd);
      }
      const updated = await reportsApi.addInfo(report.id, text.trim());
      onUpdated(updated);
      setSent(true);
    } catch {
      setError(t(locale, 'info.error'));
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      className={`rounded-lg p-6 border ${
        open ? 'border-[#FBC412]/60 bg-[#FBC412]/10' : 'border-[#EDEFF0]'
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <h3 className="font-semibold text-[#232E3D]">{t(locale, 'info.title')}</h3>
        <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold bg-white border border-[#EDEFF0] text-[#232E3D]">
          {open ? t(locale, 'info.needed_badge') : t(locale, 'info.answered_badge')}
        </span>
      </div>
      <p className="text-sm text-[#232E3D] whitespace-pre-line">{report.info_request_message}</p>

      {open ? (
        <div className="mt-4 space-y-3">
          <label className="block text-sm font-medium text-[#232E3D]" htmlFor="info-reply">
            {t(locale, 'info.reply_label')}
          </label>
          <textarea
            id="info-reply"
            rows={3}
            maxLength={2000}
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={t(locale, 'info.reply_placeholder')}
            className="block w-full rounded border border-[#EDEFF0] bg-white px-3 py-2 text-sm text-[#232E3D] placeholder:text-[#55606E] focus:border-[#006EB5] focus:outline-none focus:ring-1 focus:ring-[#006EB5]"
          />
          <label className="block text-sm text-[#006EB5] font-medium cursor-pointer">
            📷 {t(locale, 'info.add_photo')}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              onChange={e => setPhoto(e.target.files?.[0] ?? null)}
            />
          </label>
          {photo && <p className="text-xs text-[#55606E]">{photo.name}</p>}
          {error && <p className="text-sm text-[#EE402D]">{error}</p>}
          <button
            type="button"
            onClick={send}
            disabled={sending || !text.trim()}
            className="inline-flex items-center justify-center px-4 py-2.5 bg-[#006EB5] text-white text-sm font-medium rounded hover:bg-[#005a94] disabled:opacity-50 transition-colors"
          >
            {sending ? t(locale, 'info.sending') : t(locale, 'info.send')}
          </button>
        </div>
      ) : (
        <div className="mt-4">
          {sent && <p className="text-sm text-[#232E3D] mb-2">{t(locale, 'info.sent')}</p>}
          <p className="text-xs font-medium text-[#55606E]">{t(locale, 'info.your_answer')}</p>
          <p className="text-sm text-[#232E3D] whitespace-pre-line">{report.reporter_followup}</p>
        </div>
      )}
    </div>
  );
}

function ReportStatusContent({ id }: { id: string }) {
  const searchParams = useSearchParams();
  const justSubmitted = searchParams.get('submitted') === '1';
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [isReporter, setIsReporter] = useState(false);

  useEffect(() => {
    setIsReporter(getRole() === 'reporter');
  }, []);

  useEffect(() => {
    reportsApi
      .get(id)
      .then(setReport)
      .catch(() => setError('Could not load report details.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-6 h-6 border-2 border-[#006EB5] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <p className="text-[#EE402D] mb-4">{error || 'Report not found'}</p>
        <Link href="/" className="text-[#006EB5] hover:underline text-sm">
          Return home
        </Link>
      </div>
    );
  }

  const statusInfo = STATUS_MESSAGES[report.status] || STATUS_MESSAGES.pending;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="border-b border-[#EDEFF0]">
        <div className="max-w-xl mx-auto px-4 h-14 flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <MatataIcon className="h-8 w-auto" />
            <span className="font-semibold text-[#232E3D]">Matata</span>
          </Link>
        </div>
      </div>

      <div className="max-w-xl mx-auto w-full px-4 py-8 space-y-6">
        {justSubmitted && (
          <div className="bg-[#006EB5]/5 border border-[#B5D5F5] rounded-lg p-4 text-center">
            <div className="text-2xl mb-1">🎉</div>
            <p className="font-semibold text-[#232E3D]">Report submitted successfully</p>
            <p className="text-sm text-[#55606E] mt-1">Thank you. Your report is now in our queue.</p>
            {!isReporter && (
              <p className="text-xs text-[#55606E] mt-3">
                Want to track this and future reports?{' '}
                <Link href="/login" className="text-[#006EB5] hover:underline">
                  Sign in
                </Link>{' '}
                to save your submission history.
              </p>
            )}
          </div>
        )}

        <div className="border border-[#EDEFF0] rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="text-3xl">{statusInfo.icon}</div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="font-semibold text-[#232E3D]">{statusInfo.title}</h2>
                <span
                  className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${statusColors[report.status]}`}
                >
                  {report.status.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-sm text-[#55606E]">{statusInfo.desc}</p>
            </div>
          </div>
        </div>

        {report.info_requested_at && (
          <InfoRequestPanel report={report} onUpdated={setReport} />
        )}

        <div className="border border-[#EDEFF0] rounded-lg p-6">
          <h3 className="font-semibold text-[#232E3D] mb-4 text-sm uppercase tracking-wide">
            Report Details
          </h3>
          <div className="space-y-3">
            {[
              { label: 'Reference', value: report.id.slice(0, 8).toUpperCase() },
              { label: 'Crisis type', value: report.crisis_type },
              { label: 'Infrastructure', value: report.infrastructure_type },
              { label: 'Severity', value: report.damage_severity },
              { label: 'Submitted', value: formatDate(report.created_at) },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-[#55606E]">{label}</span>
                <span className="text-[#232E3D] font-medium capitalize">{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href="/report"
            className="inline-flex items-center justify-center px-4 py-2.5 bg-[#006EB5] text-white text-sm font-medium rounded hover:bg-[#005a94] transition-colors text-center"
          >
            Submit Another Report
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-4 py-2.5 bg-white text-[#232E3D] text-sm font-medium rounded border border-[#EDEFF0] hover:bg-[#EDEFF0] transition-colors text-center"
          >
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ReportStatusPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin w-6 h-6 border-2 border-[#006EB5] border-t-transparent rounded-full" />
        </div>
      }
    >
      <ReportStatusContent id={id} />
    </Suspense>
  );
}
