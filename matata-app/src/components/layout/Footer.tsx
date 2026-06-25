'use client';

import { useLanguage } from '@/contexts/LanguageContext';

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-[#EDEFF0] mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 bg-[#006EB5] rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">M</span>
              </div>
              <span className="font-semibold text-[#232E3D]">Matata</span>
            </div>
            <p className="text-xs text-[#55606E]">{t('footer.tagline')}</p>
          </div>
          <p className="text-xs text-[#55606E]">{t('footer.undp_tagline')}</p>
        </div>
      </div>
    </footer>
  );
}
