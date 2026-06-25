'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/lib/i18n';

function QueuedContent() {
  const searchParams = useSearchParams();
  const ref = searchParams.get('ref') || '';
  const { locale } = useLanguage();

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-16">
      <div className="max-w-sm w-full text-center space-y-6">
        <div className="w-16 h-16 bg-[#FBC412]/20 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-[#FBC412]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <div>
          <h1 className="text-xl font-bold text-[#232E3D] mb-2">
            {t(locale, 'offline.queued')}
          </h1>
          <p className="text-sm text-[#55606E] leading-relaxed">
            {t(locale, 'offline.queued_desc')}
          </p>
        </div>

        {ref && (
          <div className="bg-[#EDEFF0] rounded-lg px-4 py-3">
            <p className="text-xs text-[#55606E] mb-1">{t(locale, 'status.reference')}</p>
            <p className="text-sm font-mono font-medium text-[#232E3D] break-all">{ref}</p>
          </div>
        )}

        <div className="bg-[#FBC412]/10 border border-[#FBC412]/30 rounded-lg p-3">
          <p className="text-xs text-[#55606E]">
            {t(locale, 'offline.token_warning')}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href="/report"
            className="inline-flex items-center justify-center px-6 py-3 bg-[#006EB5] text-white text-sm font-semibold rounded hover:bg-[#005a94] transition-colors"
          >
            {t(locale, 'status.submit_another')}
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 border border-[#EDEFF0] text-sm font-medium text-[#55606E] rounded hover:border-[#B5D5F5] transition-colors"
          >
            {t(locale, 'status.return_home')}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function QueuedPage() {
  return (
    <Suspense>
      <QueuedContent />
    </Suspense>
  );
}
