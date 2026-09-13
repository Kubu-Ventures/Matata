'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLoginWithEmail } from '@privy-io/react-auth';
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

  // --- TEMPORARY DEBUG — REMOVE AFTER DIAGNOSIS ---
  const [debugLog, setDebugLog] = useState<string[]>([]);
  function debug(msg: string) {
    const line = `${new Date().toISOString().slice(11, 23)}  ${msg}`;
    setDebugLog(prev => [...prev, line]);
  }
  function stringifyErr(err: unknown): string {
    try {
      if (err instanceof Error) {
        return JSON.stringify(
          { name: err.name, message: err.message, ...(err as unknown as Record<string, unknown>) },
          Object.getOwnPropertyNames(err)
        );
      }
      return JSON.stringify(err);
    } catch {
      return String(err);
    }
  }
  // --- END TEMPORARY DEBUG ---

  function goToStep(next: 'email' | 'code') {
    setStep(next);
    onStepChange?.(next, email);
  }

  const { sendCode, loginWithCode, state } = useLoginWithEmail({
    onComplete: async () => {
      debug('onComplete fired'); // TEMP DEBUG
      setFinishing(true);
      try {
        const { isElevated } = await exchangePrivySession();
        debug(`exchangePrivySession resolved isElevated=${isElevated}`); // TEMP DEBUG
        if (analyst && !isElevated) {
          clearAuth();
          clearPrivySession();
          setError(t('login.analyst_no_access'));
          setFinishing(false);
          return;
        }
        router.push(isElevated ? '/analyst/dashboard' : '/report');
      } catch (err: unknown) {
        debug(`exchangePrivySession threw: ${stringifyErr(err)}`); // TEMP DEBUG
        const apiErr = err as { status?: number; message?: string };
        setError(
          apiErr.status === 429
            ? t('errors.rate_limit_exceeded')
            : apiErr.message || t('errors.internal')
        );
        setFinishing(false);
      }
    },
    onError: (err) => {
      debug(`useLoginWithEmail onError: ${stringifyErr(err)}`); // TEMP DEBUG
      setError(privyErrorMessage(err, t));
    },
  });

  // TEMP DEBUG — log every Privy state transition so a silent hang is visible.
  useEffect(() => {
    debug(`privy state.status = ${state.status}`);
  }, [state.status]);

  const sending = state.status === 'sending-code';
  const verifying = state.status === 'submitting-code' || finishing;

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    debug(`handleSendCode called, email="${email}"`); // TEMP DEBUG
    try {
      await sendCode({ email });
      debug('sendCode() resolved successfully'); // TEMP DEBUG
      goToStep('code');
    } catch (err: unknown) {
      debug(`sendCode() threw: ${stringifyErr(err)}`); // TEMP DEBUG
      setError(privyErrorMessage(err, t));
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    debug('handleVerifyCode called'); // TEMP DEBUG
    try {
      await loginWithCode({ code });
      debug('loginWithCode() resolved successfully'); // TEMP DEBUG
    } catch (err: unknown) {
      debug(`loginWithCode() threw: ${stringifyErr(err)}`); // TEMP DEBUG
      setError(privyErrorMessage(err, t));
    }
  }

  // --- TEMPORARY DEBUG PANEL — REMOVE AFTER DIAGNOSIS ---
  const debugPanel = (
    <pre
      style={{
        marginTop: '1rem',
        padding: '0.75rem',
        background: '#111',
        color: '#0f0',
        fontSize: '11px',
        lineHeight: 1.4,
        borderRadius: '6px',
        maxHeight: '260px',
        overflow: 'auto',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}
    >
      {'DEBUG PANEL (temporary) — status=' + state.status + '\n' + debugLog.join('\n')}
    </pre>
  );
  // --- END TEMPORARY DEBUG PANEL ---

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
        {debugPanel}
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
      {debugPanel}
    </form>
  );
}
