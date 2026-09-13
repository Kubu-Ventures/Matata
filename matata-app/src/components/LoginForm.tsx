'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLoginWithEmail, useIdentityToken } from '@privy-io/react-auth';
import { exchangePrivySession, privyErrorMessage } from '@/lib/privyLogin';
import { clearPrivySession, isPrivyConfigured } from '@/components/PrivyClientProvider';
import { clearAuth } from '@/lib/auth';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

type Variant = 'reporter' | 'analyst';

/**
 * The interactive email OTP card shared by `/login` (reporters) and
 * `/analyst/login`. The surrounding page shell (background, logo, footer link)
 * stays in each page. This piece is loaded via `dynamic(ssr: false)` so it
 * never runs on the server and always has the Privy provider by mount time.
 *
 * `onStepChange` lets the page swap its own subtitle between the email and
 * code steps, matching the original two-page behaviour.
 */
export function LoginForm({
  variant,
  onStepChange,
}: {
  variant: Variant;
  onStepChange?: (step: 'email' | 'code', email: string) => void;
}) {
  const router = useRouter();
  const { t } = useLanguage();
  const analyst = variant === 'analyst';

  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [finishing, setFinishing] = useState(false);

  function goToStep(next: 'email' | 'code') {
    setStep(next);
    onStepChange?.(next, email);
  }

  // useIdentityToken() reads Privy's own React context, which PrivyProvider
  // keeps genuinely up to date — unlike the standalone getIdentityToken()
  // function (see privyLogin.ts for why that one silently fails). Mirrored
  // into a ref so the onComplete closure below always reads the latest
  // value instead of the one captured when useLoginWithEmail was set up.
  const { identityToken } = useIdentityToken();
  const identityTokenRef = useRef(identityToken);
  useEffect(() => {
    identityTokenRef.current = identityToken;
  }, [identityToken]);

  const { sendCode, loginWithCode, state } = useLoginWithEmail({
    onComplete: async () => {
      setFinishing(true);
      try {
        // The identity token can land a beat after login completes (it's
        // populated by Privy's own effect) — give it a short window before
        // proceeding without one.
        if (!identityTokenRef.current) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        const { isElevated } = await exchangePrivySession(identityTokenRef.current);
        if (analyst && !isElevated) {
          clearAuth();
          clearPrivySession();
          setError(t('login.analyst_no_access'));
          setFinishing(false);
          return;
        }
        router.push(isElevated ? '/analyst/dashboard' : '/report');
      } catch (err: unknown) {
        const apiErr = err as { status?: number; message?: string };
        setError(
          apiErr.status === 429
            ? t('errors.rate_limit_exceeded')
            : apiErr.message || t('errors.internal')
        );
        setFinishing(false);
      }
    },
    onError: (err) => setError(privyErrorMessage(err, t)),
  });

  const sending = state.status === 'sending-code';
  const verifying = state.status === 'submitting-code' || finishing;

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await sendCode({ email });
      goToStep('code');
    } catch (err: unknown) {
      setError(privyErrorMessage(err, t));
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await loginWithCode({ code });
    } catch (err: unknown) {
      setError(privyErrorMessage(err, t));
    }
  }

  if (!isPrivyConfigured) {
    return (
      <p className="text-sm text-[#EE402D]">
        {t('login.not_configured')}
      </p>
    );
  }

  if (step === 'email') {
    return (
      <form onSubmit={handleSendCode} className="space-y-4">
        <Input
          id="email"
          label={t('login.email_label')}
          type="email"
          autoComplete="email"
          placeholder={analyst ? 'you@example.org' : t('login.email_placeholder')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          helper={analyst ? t('login.analyst_email_helper') : t('login.email_helper')}
          required
        />
        {error && <p className="text-sm text-[#EE402D]">{error}</p>}
        <Button type="submit" loading={sending} className="w-full" size="lg">
          {t('login.send_code')}
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleVerifyCode} className="space-y-4">
      <Input
        id="code"
        label={t('login.otp_label')}
        type="text"
        inputMode="numeric"
        pattern="[0-9]{6}"
        maxLength={6}
        autoComplete="one-time-code"
        placeholder="000000"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        required
      />
      {error && <p className="text-sm text-[#EE402D]">{error}</p>}
      <Button type="submit" loading={verifying} className="w-full" size="lg">
        {analyst ? t('login.analyst_sign_in') : t('login.verify_code')}
      </Button>
      <button
        type="button"
        onClick={() => {
          goToStep('email');
          setCode('');
          setError('');
        }}
        className="w-full text-sm text-[#55606E] hover:text-[#006EB5] transition-colors"
      >
        {t('login.change_email')}
      </button>
    </form>
  );
}
