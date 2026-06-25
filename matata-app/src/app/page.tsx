'use client';

import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useLanguage } from '@/contexts/LanguageContext';

const CRISIS_ICONS: Record<string, string> = {
  flood: '🌊',
  earthquake: '🏚️',
  conflict: '⚠️',
  wildfire: '🔥',
};

export default function LandingPage() {
  const { t } = useLanguage();

  const howItWorks = [
    { step: '1', titleKey: 'landing.step1_title' as const, descKey: 'landing.step1_desc' as const },
    { step: '2', titleKey: 'landing.step2_title' as const, descKey: 'landing.step2_desc' as const },
    { step: '3', titleKey: 'landing.step3_title' as const, descKey: 'landing.step3_desc' as const },
  ];

  const crisisKeys = ['flood', 'earthquake', 'conflict', 'wildfire'] as const;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <div className="bg-[#232E3D] text-white">
        <Header transparent />
        <div className="max-w-4xl mx-auto px-4 py-20 md:py-28">
          <div className="max-w-2xl">
            <p className="text-[#0093D9] text-sm font-medium uppercase tracking-widest mb-4">
              {t('landing.badge')}
            </p>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
              {t('landing.hero_title')}
            </h1>
            <p className="text-lg text-white/80 mb-10 leading-relaxed">
              {t('landing.hero_desc')}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/report"
                className="inline-flex items-center justify-center px-8 py-4 bg-[#006EB5] text-white text-base font-semibold rounded hover:bg-[#005a94] transition-colors"
              >
                {t('landing.cta_primary')}
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-8 py-4 bg-white/10 text-white text-base font-medium rounded hover:bg-white/20 transition-colors border border-white/30"
              >
                {t('landing.cta_secondary')}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Crisis types */}
      <div className="bg-white py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl font-semibold text-[#232E3D] mb-8 text-center">
            {t('landing.crisis_section_title')}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {crisisKeys.map((type) => (
              <div
                key={type}
                className="text-center p-6 rounded-lg border border-[#EDEFF0] hover:border-[#B5D5F5] transition-colors"
              >
                <div className="text-3xl mb-2">{CRISIS_ICONS[type]}</div>
                <p className="text-sm font-medium text-[#232E3D]">{t(`crisis.${type}`)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-[#EDEFF0] py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl font-semibold text-[#232E3D] mb-10 text-center">
            {t('landing.how_title')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {howItWorks.map(({ step, titleKey, descKey }) => (
              <div key={step} className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-[#006EB5] text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {step}
                </div>
                <div>
                  <h3 className="font-semibold text-[#232E3D] mb-1">{t(titleKey)}</h3>
                  <p className="text-sm text-[#55606E] leading-relaxed">{t(descKey)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA section */}
      <div className="bg-[#006EB5] py-16">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            {t('landing.cta2_title')}
          </h2>
          <p className="text-white/80 mb-8">
            {t('landing.cta2_desc')}
          </p>
          <Link
            href="/report"
            className="inline-flex items-center justify-center px-8 py-4 bg-white text-[#006EB5] text-base font-semibold rounded hover:bg-[#EDEFF0] transition-colors"
          >
            {t('landing.submit_report')}
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}
