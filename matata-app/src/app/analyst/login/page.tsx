'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api';
import { saveAuth } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { Role } from '@/lib/types';

export default function AnalystLoginPage() {
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
      setError(apiErr.message || 'Failed to send code. Please check your number.');
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
      if (!['analyst', 'responder', 'admin'].includes(data.role)) {
        setError('This account does not have analyst access. Please contact your administrator.');
        return;
      }
      saveAuth(data.token, data.role as Role, data.refresh_token);
      router.push('/analyst/dashboard');
    } catch (err: unknown) {
      const apiErr = err as { status?: number };
      if (apiErr.status === 429) {
        setError('Too many attempts. Please wait 15 minutes.');
      } else {
        setError('Invalid or expired code.');
      }
    } finally {
      setLoading(false);
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
            {step === 'phone'
              ? 'Enter your registered phone number'
              : `Enter the code sent to ${phone}`}
          </p>
        </div>

        <div className="bg-white rounded-lg p-6">
          {step === 'phone' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <Input
                id="phone"
                label="Phone number"
                type="tel"
                placeholder="+254700000000"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                helper="E.164 format with country code"
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
                Sign In
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
