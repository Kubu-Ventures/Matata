'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLoginWithEmail } from '@privy-io/react-auth';
import { exchangePrivySession, privyErrorMessage } from '@/lib/privyLogin';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function LoginPage() {
  const router = useRouter();
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
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-[#006EB5] rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">M</span>
            </div>
            <span className="font-semibold text-lg text-[#232E3D]">Matata</span>
          </Link>
          <h1 className="text-2xl font-bold text-[#232E3D]">Sign in</h1>
          <p className="text-sm text-[#55606E] mt-1">
            {step === 'email'
              ? 'Enter your email to receive a code'
              : `Enter the 6-digit code sent to ${email}`}
          </p>
        </div>

        <div className="bg-white rounded-lg border border-[#EDEFF0] p-6 shadow-sm">
          {step === 'email' ? (
            <form onSubmit={handleSendCode} className="space-y-4">
              <Input
                id="email"
                label="Email address"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                helper="We'll email you a one-time code"
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
                Verify Code
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

        <p className="text-center text-xs text-[#55606E] mt-6">
          Reporting anonymously?{' '}
          <Link href="/report" className="text-[#006EB5] hover:underline">
            Continue without signing in
          </Link>
        </p>
      </div>
    </div>
  );
}
