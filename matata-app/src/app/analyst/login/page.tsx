'use client';

import { useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useLanguage } from '@/contexts/LanguageContext';
import { MatataIcon } from '@/components/layout/MatataIcon';

const LoginForm = dynamic(
  () => import('@/components/LoginForm').then((m) => m.LoginForm),
  { ssr: false, loading: () => <div className="h-40" /> }
);

export default function AnalystLoginPage() {
  const { t } = useLanguage();
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');

  return (
    <div className="min-h-screen bg-[#232E3D] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-6">
            <MatataIcon className="h-10 w-auto" />
            <span className="font-semibold text-xl text-white">Matata</span>
          </div>
          <h1 className="text-2xl font-bold text-white">{t('login.analyst_title')}</h1>
          <p className="text-sm text-white/60 mt-1">
            {step === 'email'
              ? t('login.analyst_desc_email')
              : t('login.analyst_desc_otp', { email })}
          </p>
        </div>

        <div className="bg-white rounded-lg p-6">
          <LoginForm
            variant="analyst"
            onStepChange={(s, e) => {
              setStep(s);
              setEmail(e);
            }}
          />
        </div>

        <p className="text-center text-xs text-white/40 mt-6">
          {t('login.analyst_restricted')}{' '}
          <Link href="/" className="text-white/60 hover:text-white transition-colors">
            {t('login.return_home')}
          </Link>
        </p>
      </div>
    </div>
  );
}
