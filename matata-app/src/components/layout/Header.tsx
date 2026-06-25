'use client';

import Link from 'next/link';
import LanguagePicker from '@/components/ui/LanguagePicker';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/lib/i18n';

interface HeaderProps {
  transparent?: boolean;
}

export function Header({ transparent }: HeaderProps) {
  const { locale } = useLanguage();

  return (
    <header
      className={`w-full border-b ${
        transparent ? 'bg-transparent border-white/20' : 'bg-white border-[#EDEFF0]'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#006EB5] rounded flex items-center justify-center">
            <span className="text-white text-xs font-bold">M</span>
          </div>
          <span
            className={`font-semibold text-lg tracking-tight ${
              transparent ? 'text-white' : 'text-[#232E3D]'
            }`}
          >
            Matata
          </span>
        </Link>
        <nav className="flex items-center gap-3">
          <LanguagePicker />
          <Link
            href="/report"
            className="px-4 py-2 bg-[#006EB5] text-white text-sm font-medium rounded hover:bg-[#005a94] transition-colors"
          >
            {t(locale, 'nav.report_now')}
          </Link>
        </nav>
      </div>
    </header>
  );
}
