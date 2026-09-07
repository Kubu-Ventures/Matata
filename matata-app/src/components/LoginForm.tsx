'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLoginWithEmail } from '@privy-io/react-auth';
import { exchangePrivySession, privyErrorMessage } from '@/lib/privyLogin';
import { clearPrivySession, isPrivyConfigured } from '@/components/PrivyClientProvider';
import { clearAuth } from '@/lib/auth';
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

  const { sendCode, loginWithCode, state } = useLoginWithEmail({
    onComplete: async () => {
      setFinishing(true);
      try {
        const { isElevated } = await exchangePrivySession();
        if (analyst && !isElevated) {
          clearAuth();
          clearPrivySession();
          setError(
            'This account does not have analyst access. Please contact your administrator.'
          );
          setFinishing(false);
          return;
        }
        router.push(isElevated ? '/analyst/dashboard' : '/report');
      } catch (err: unknown) {
        const apiErr = err as { status?: number; message?: string };
        setError(
          apiErr.status === 429
            ? 'Too many attempts. Please wait a minute and try again.'
            : apiErr.message || 'Could not complete sign in. Please try again.'
        );
        setFinishing(false);
      }
    },
    onError: (err) => setError(privyErrorMessage(err)),
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
      setError(privyErrorMessage(err));
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await loginWithCode({ code });
    } catch (err: unknown) {
      setError(privyErrorMessage(err));
    }
  }

  if (!isPrivyConfigured) {
    return (
      <p className="text-sm text-[#EE402D]">
        Sign in is not configured for this environment (NEXT_PUBLIC_PRIVY_APP_ID is unset).
      </p>
    );
  }

  if (step === 'email') {
    return (
      <form onSubmit={handleSendCode} className="space-y-4">
        <Input
          id="email"
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder={analyst ? 'you@example.org' : 'you@example.com'}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          helper={
            analyst
              ? 'The address your administrator provisioned'
              : "We'll email you a one-time code"
          }
          required
        />
        {error && <p className="text-sm text-[#EE402D]">{error}</p>}
        <Button type="submit" loading={sending} className="w-full" size="lg">
          Send Code
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleVerifyCode} className="space-y-4">
      <Input
        id="code"
        label="Verification code"
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
        {analyst ? 'Sign In' : 'Verify Code'}
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
        Change email address
      </button>
    </form>
  );
}
