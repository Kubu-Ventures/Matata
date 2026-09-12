'use client';

import { useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useLanguage } from '@/contexts/LanguageContext';

const LoginForm = dynamic(
  () => import('@/components/LoginForm').then((m) => m.LoginForm),
  { ssr: false, loading: () => <div className="h-40" /> }
);

export default function LoginPage() {
  const { t } = useLanguage();
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-[#006EB5] rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">M</span>
            </div>
            <span className="font-semibold text-lg text-[#232E3D]">Matata</span>
          </Link>
          <h1 className="text-2xl font-bold text-[#232E3D]">{t('login.title')}</h1>
          <p className="text-sm text-[#55606E] mt-1">
            {step === 'email'
              ? t('login.email_step_desc')
              : t('login.otp_step_desc', { email })}
          </p>
        </div>

        <div className="bg-white rounded-lg border border-[#EDEFF0] p-6 shadow-sm">
          <LoginForm
            variant="reporter"
            onStepChange={(s, e) => {
              setStep(s);
              setEmail(e);
            }}
          />
        </div>

        <p className="text-center text-xs text-[#55606E] mt-6">
          {t('login.anonymous_cta')}{' '}
          <Link href="/report" className="text-[#006EB5] hover:underline">
            {t('login.anonymous_link')}
          </Link>
        </p>
      </div>
    </div>
  );
}
