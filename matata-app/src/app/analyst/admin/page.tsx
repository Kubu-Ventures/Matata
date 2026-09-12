'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { adminApi } from '@/lib/api';
import type { AdminAccount } from '@/lib/types';

const ROLE_BADGE: Record<string, string> = {
  admin: 'bg-[#EE402D]/10 text-[#EE402D]',
  analyst: 'bg-[#006EB5]/10 text-[#006EB5]',
  responder: 'bg-green-100 text-green-800',
};

export default function AdminAccountsPage() {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('analyst');
  const [regionGeojson, setRegionGeojson] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [accountsError, setAccountsError] = useState('');
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);

  async function loadAccounts() {
    setAccountsLoading(true);
    setAccountsError('');
    try {
      const list = await adminApi.listAccounts();
      setAccounts(list);
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setAccountsError(apiErr.message || 'Failed to load accounts.');
    } finally {
      setAccountsLoading(false);
    }
  }

  useEffect(() => {
    loadAccounts();
  }, []);

  async function handleProvision(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    setError('');
    try {
      await adminApi.provisionUser(email, role, role === 'responder' ? regionGeojson : undefined);
      setSuccess(`Account provisioned for ${email} with role: ${role}`);
      setEmail('');
      setRegionGeojson('');
      loadAccounts();
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr.message || 'Failed to provision account. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeactivate(id: string) {
    if (!window.confirm('Deactivate this account? They will no longer be able to sign in, though any active session will remain valid until it expires.')) {
      return;
    }
    setDeactivatingId(id);
    setAccountsError('');
    try {
      await adminApi.deactivateAccount(id);
      setAccounts(prev => prev.filter(a => a.id !== id));
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setAccountsError(apiErr.message || 'Failed to deactivate account.');
    } finally {
      setDeactivatingId(null);
    }
  }

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-xl font-bold text-[#232E3D] mb-2">Account Management</h1>
      <p className="text-sm text-[#55606E] mb-6">Provision analyst and responder accounts.</p>

      <div className="bg-white rounded-lg border border-[#EDEFF0] p-6">
        <h2 className="font-medium text-[#232E3D] mb-4">Provision New Account</h2>
        <form onSubmit={handleProvision} className="space-y-4">
          <Input
            label="Email address"
            type="email"
            placeholder="name@organisation.org"
            value={email}
            onChange={e => setEmail(e.target.value)}
            helper="The address this person will sign in with"
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

          {role === 'responder' && (
            <div className="space-y-1">
              <label className="block text-sm font-medium text-[#232E3D]">
                Region (GeoJSON)
              </label>
              <textarea
                value={regionGeojson}
                onChange={e => setRegionGeojson(e.target.value)}
                placeholder='{"type": "Polygon", "coordinates": [...]}'
                rows={4}
                required
                className="block w-full rounded border px-3 py-2 text-sm text-[#232E3D] placeholder:text-[#55606E] font-mono transition-colors border-[#EDEFF0] bg-white focus:border-[#006EB5] focus:outline-none focus:ring-1 focus:ring-[#006EB5]"
              />
              <p className="text-xs text-[#55606E]">
                Scopes this responder to reports within the given area. Required for the responder role.
              </p>
            </div>
          )}

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
          via the email OTP flow using this address. Ensure you provision only trusted
          individuals.
        </p>
      </div>

      <div className="mt-8 bg-white rounded-lg border border-[#EDEFF0] p-6">
        <h2 className="font-medium text-[#232E3D] mb-1">Active Accounts</h2>
        <p className="text-xs text-[#55606E] mb-4">
          Email addresses are hashed and never stored in plaintext, so accounts are listed by ID.
        </p>

        {accountsError && (
          <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
            <p className="text-sm text-[#EE402D]">{accountsError}</p>
          </div>
        )}

        {accountsLoading ? (
          <p className="text-sm text-[#55606E]">Loading accounts…</p>
        ) : accounts.length === 0 ? (
          <p className="text-sm text-[#55606E]">No active accounts provisioned yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#EDEFF0] text-left text-xs text-[#55606E]">
                  <th className="py-2 pr-4 font-medium">Account ID</th>
                  <th className="py-2 pr-4 font-medium">Role</th>
                  <th className="py-2 pr-4 font-medium">Region</th>
                  <th className="py-2 pr-4 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {accounts.map(account => (
                  <tr key={account.id} className="border-b border-[#EDEFF0] last:border-0">
                    <td className="py-2 pr-4 font-mono text-xs text-[#232E3D]">{account.id.slice(0, 8)}…</td>
                    <td className="py-2 pr-4">
                      <Badge className={ROLE_BADGE[account.role] || 'bg-[#EDEFF0] text-[#232E3D]'}>
                        {account.role}
                      </Badge>
                    </td>
                    <td className="py-2 pr-4 text-[#55606E]">
                      {account.region_geojson ? 'Scoped' : '—'}
                    </td>
                    <td className="py-2 pr-4 text-right">
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        loading={deactivatingId === account.id}
                        onClick={() => handleDeactivate(account.id)}
                      >
                        Deactivate
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
