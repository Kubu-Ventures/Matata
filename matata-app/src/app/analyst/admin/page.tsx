'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://157.173.121.74:8000/api/v1';

export default function AdminAccountsPage() {
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('analyst');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  async function handleProvision(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    setError('');
    try {
      const token = localStorage.getItem('matata_token');
      const res = await fetch(`${BASE_URL}/auth/analyst/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ phone, role }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error || 'Failed to provision account');
      }
      setSuccess(`Account provisioned for ${phone} with role: ${role}`);
      setPhone('');
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr.message || 'Failed to provision account. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-xl font-bold text-[#232E3D] mb-2">Account Management</h1>
      <p className="text-sm text-[#55606E] mb-6">Provision analyst and responder accounts.</p>

      <div className="bg-white rounded-lg border border-[#EDEFF0] p-6">
        <h2 className="font-medium text-[#232E3D] mb-4">Provision New Account</h2>
        <form onSubmit={handleProvision} className="space-y-4">
          <Input
            label="Phone number"
            type="tel"
            placeholder="+254700000000"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            helper="E.164 format with country code"
            required
          />
          <Select
            label="Role"
            options={[
              { value: 'analyst', label: 'Analyst — full triage access' },
              { value: 'responder', label: 'Responder — read-only regional access' },
              { value: 'admin', label: 'Admin — full administrative access' },
            ]}
            value={role}
            onChange={e => setRole(e.target.value)}
          />

          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <p className="text-sm text-[#EE402D]">{error}</p>
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded p-3">
              <p className="text-sm text-green-800">✓ {success}</p>
            </div>
          )}

          <Button type="submit" loading={loading} className="w-full" size="lg">
            Provision Account
          </Button>
        </form>
      </div>

      <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <p className="text-xs text-yellow-800">
          <strong>Security notice:</strong> The provisioned user will be able to log in immediately
          via the OTP flow using the registered phone number. Ensure you provision only trusted
          individuals.
        </p>
      </div>
    </div>
  );
}
