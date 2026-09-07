'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLoginWithEmail, usePrivy } from '@privy-io/react-auth';
import { exchangePrivySession, privyErrorMessage } from '@/lib/privyLogin';
import { clearAuth } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function AnalystLoginPage() {
  const router = useRouter();
  const { logout: privyLogout } = usePrivy();
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [finishing, setFinishing] = useState(false);

  const { sendCode, loginWithCode, state } = useLoginWithEmail({
    onComplete: async () => {
      setFinishing(true);
      try {
        const { isElevated } = await exchangePrivySession();
        if (!isElevated) {
          // Backend issued a plain reporter session — this email isn't a
          // provisioned analyst. Drop it and keep them on this page.
          clearAuth();
          await privyLogout().catch(() => {});
          setError(
            'This account does not have analyst access. Please contact your administrator.'
          );
          setFinishing(false);
          return;
        }
        router.push('/analyst/dashboard');
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
      setStep('code');
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

  return (
    <div className="min-h-screen bg-[#232E3D] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-6">
            <div className="w-9 h-9 bg-[#006EB5] rounded flex items-center justify-center">
              <span className="text-white font-bold">M</span>
            </div>
            <span className="font-semibold text-xl text-white">Matata</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Analyst Portal</h1>
          <p className="text-sm text-white/60 mt-1">
            {step === 'email'
              ? 'Enter your registered email address'
              : `Enter the code sent to ${email}`}
          </p>
        </div>

        <div className="bg-white rounded-lg p-6">
          {step === 'email' ? (
            <form onSubmit={handleSendCode} className="space-y-4">
              <Input
                id="email"
                label="Email address"
                type="email"
                autoComplete="email"
                placeholder="you@example.org"
                value={email}
                onChange={e => setEmail(e.target.value)}
                helper="The address your administrator provisioned"
                required
              />
              {error && <p className="text-sm text-[#EE402D]">{error}</p>}
              <Button type="submit" loading={sending} className="w-full" size="lg">
                Send Code
              </Button>
            </form>
          ) : (
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
                onChange={e => setCode(e.target.value)}
                required
              />
              {error && <p className="text-sm text-[#EE402D]">{error}</p>}
              <Button type="submit" loading={verifying} className="w-full" size="lg">
                Sign In
              </Button>
              <button
                type="button"
                onClick={() => {
                  setStep('email');
                  setCode('');
                  setError('');
                }}
                className="w-full text-sm text-[#55606E] hover:text-[#006EB5] transition-colors"
              >
                Change email address
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-white/40 mt-6">
          Access is restricted to provisioned accounts.{' '}
          <Link href="/" className="text-white/60 hover:text-white transition-colors">
            Return home
          </Link>
        </p>
      </div>
    </div>
  );
}
