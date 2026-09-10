'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLoginWithEmail } from '@privy-io/react-auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function LoginPage() {
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');

  const { sendCode, loginWithCode, state } = useLoginWithEmail({
    onError: (err) => {
      setError(err.message || 'Something went wrong. Please try again.');
    },
    onComplete: () => {
      console.log('Privy login complete');
    },
  });

  const loading =
    state.status === 'sending-code' ||
    state.status === 'submitting-code';

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    try {
      await sendCode({ email });
      setStep('otp');
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to send code. Please check your email and try again.';

      setError(message);
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    try {
      await loginWithCode({ code: otp });
      console.log('Privy access token login completed');
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Invalid or expired code. Please try again.';

      setError(message);
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

          <h1 className="text-2xl font-bold text-[#232E3D]">
            Sign in
          </h1>

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
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />

              {error && (
                <p className="text-sm text-[#EE402D]">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                loading={loading}
                className="w-full"
                size="lg"
              >
                Send Code
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <Input
                id="otp"
                label="Verification code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                placeholder="000000"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                required
              />

              {error && (
                <p className="text-sm text-[#EE402D]">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                loading={loading}
                className="w-full"
                size="lg"
              >
                Verify Code
              </Button>

              <button
                type="button"
                onClick={() => {
                  setStep('email');
                  setOtp('');
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
          <Link
            href="/report"
            className="text-[#006EB5] hover:underline"
          >
            Continue without signing in
          </Link>
        </p>
      </div>
    </div>
  );
}