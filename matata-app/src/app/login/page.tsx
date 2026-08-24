'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api';
import { saveAuth } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { Role } from '@/lib/types';

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.sendOtp(phone);
      setStep('otp');
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr.message || 'Failed to send OTP. Check your number and try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await authApi.verifyOtp(phone, otp);
      saveAuth(data.token, data.role as Role, data.refresh_token);
      if (['analyst', 'responder', 'admin'].includes(data.role)) {
        router.push('/analyst/dashboard');
      } else {
        router.push('/report');
      }
    } catch (err: unknown) {
      const apiErr = err as { status?: number };
      if (apiErr.status === 429) {
        setError('Too many attempts. Please wait 15 minutes before trying again.');
      } else {
        setError('Invalid or expired code. Please try again.');
      }
    } finally {
      setLoading(false);
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
            {step === 'phone'
              ? 'Enter your phone number to receive a code'
              : `Enter the 6-digit code sent to ${phone}`}
          </p>
        </div>

        <div className="bg-white rounded-lg border border-[#EDEFF0] p-6 shadow-sm">
          {step === 'phone' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <Input
                id="phone"
                label="Phone number"
                type="tel"
                placeholder="+254700000000"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                helper="Include country code, e.g. +254 for Kenya"
                required
              />
              {error && <p className="text-sm text-[#EE402D]">{error}</p>}
              <Button type="submit" loading={loading} className="w-full" size="lg">
                Send Code
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
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
              {error && <p className="text-sm text-[#EE402D]">{error}</p>}
              <Button type="submit" loading={loading} className="w-full" size="lg">
                Verify Code
              </Button>
              <button
                type="button"
                onClick={() => {
                  setStep('phone');
                  setOtp('');
                  setError('');
                }}
                className="w-full text-sm text-[#55606E] hover:text-[#006EB5] transition-colors"
              >
                Change phone number
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