'use client';

import { useEffect, useState } from 'react';
import { ShieldAlert, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Alert,
  Chip,
  EmptyState,
  LoadingBlock,
  PageContainer,
  PageHeader,
  Panel,
  SelectField,
  fieldInputClass,
  fieldLabelClass,
} from '@/components/analyst/ui';
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
  const [label, setLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [accountsError, setAccountsError] = useState('');
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [savingLabelId, setSavingLabelId] = useState<string | null>(null);

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
      await adminApi.provisionUser(
        email,
        role,
        role === 'responder' ? regionGeojson : undefined,
        label.trim() || undefined
      );
      setSuccess(`Account provisioned for ${email} with role: ${role}`);
      setEmail('');
      setRegionGeojson('');
      setLabel('');
      loadAccounts();
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr.message || 'Failed to provision account. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function startEditLabel(account: AdminAccount) {
    setEditingId(account.id);
    setEditValue(account.label || '');
  }

  function cancelEditLabel() {
    setEditingId(null);
    setEditValue('');
  }

  async function saveLabel(id: string) {
    setSavingLabelId(id);
    setAccountsError('');
    try {
      const updated = await adminApi.updateAccountLabel(id, editValue.trim() || null);
      setAccounts(prev => prev.map(a => (a.id === id ? updated : a)));
      setEditingId(null);
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setAccountsError(apiErr.message || 'Failed to update label.');
    } finally {
      setSavingLabelId(null);
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
    <PageContainer>
      <PageHeader
        title="Account Management"
        description="Provision analyst and responder accounts."
        meta={!accountsLoading && <span>{accounts.length} active account{accounts.length === 1 ? '' : 's'}</span>}
      />

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-3">
        <Panel
          className="lg:col-span-2"
          title="Active Accounts"
          description={
            <>
              Email addresses are hashed and never stored in plaintext. Give an account a label to
              recognise it later — click a label to edit it.
            </>
          }
          bodyClassName="p-0 sm:p-0"
        >
          {accountsError && <Alert className="m-4">{accountsError}</Alert>}

          {accountsLoading ? (
            <LoadingBlock className="py-10" />
          ) : accounts.length === 0 ? (
            <EmptyState icon={Users} title="No active accounts provisioned yet." />
          ) : (
            <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#EDEFF0] bg-[#F7F8FA] text-left text-xs uppercase tracking-wide text-[#55606E]">
                    <th className="px-4 py-2.5 font-medium sm:px-5">Label</th>
                    <th className="px-4 py-2.5 font-medium">Account ID</th>
                    <th className="px-4 py-2.5 font-medium">Role</th>
                    <th className="px-4 py-2.5 font-medium">Region</th>
                    <th className="px-4 py-2.5 font-medium sm:px-5"></th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map(account => (
                    <tr key={account.id} className="border-b border-[#EDEFF0] last:border-0">
                      <td className="px-4 py-2.5 sm:px-5">
                        {editingId === account.id ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              autoFocus
                              type="text"
                              value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') saveLabel(account.id);
                                if (e.key === 'Escape') cancelEditLabel();
                              }}
                              placeholder="e.g. field-lead-mombasa"
                              className={`${fieldInputClass} h-8 w-40 text-xs`}
                            />
                            <Button
                              type="button"
                              size="sm"
                              loading={savingLabelId === account.id}
                              onClick={() => saveLabel(account.id)}
                            >
                              Save
                            </Button>
                            <button
                              type="button"
                              onClick={cancelEditLabel}
                              className="text-xs text-[#55606E] hover:text-[#232E3D]"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => startEditLabel(account)}
                            className="text-left font-medium text-[#232E3D] hover:text-[#006EB5] hover:underline"
                          >
                            {account.label || <span className="font-normal text-[#55606E]">Add label</span>}
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs text-[#232E3D]">{account.id.slice(0, 8)}…</td>
                      <td className="px-4 py-2.5">
                        <Chip className={ROLE_BADGE[account.role] || 'bg-[#EDEFF0] text-[#232E3D]'}>
                          {account.role}
                        </Chip>
                      </td>
                      <td className="px-4 py-2.5 text-[#55606E]">
                        {account.region_geojson ? 'Scoped' : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-right sm:px-5">
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
              {/* Cards — phones */}
              <ul className="divide-y divide-[#EDEFF0] md:hidden">
                {accounts.map(account => (
                  <li key={account.id} className="space-y-2.5 px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        {editingId === account.id ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              autoFocus
                              type="text"
                              value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') saveLabel(account.id);
                                if (e.key === 'Escape') cancelEditLabel();
                              }}
                              placeholder="e.g. field-lead-mombasa"
                              className={`${fieldInputClass} h-8 w-40 text-xs`}
                            />
                            <Button
                              type="button"
                              size="sm"
                              loading={savingLabelId === account.id}
                              onClick={() => saveLabel(account.id)}
                            >
                              Save
                            </Button>
                            <button
                              type="button"
                              onClick={cancelEditLabel}
                              className="text-xs text-[#55606E] hover:text-[#232E3D]"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => startEditLabel(account)}
                            className="text-left font-medium text-[#232E3D] hover:text-[#006EB5] hover:underline"
                          >
                            {account.label || <span className="font-normal text-[#55606E]">Add label</span>}
                          </button>
                        )}
                        <p className="mt-0.5 font-mono text-xs text-[#55606E]">{account.id.slice(0, 8)}…</p>
                      </div>
                      <Chip className={ROLE_BADGE[account.role] || 'bg-[#EDEFF0] text-[#232E3D]'}>{account.role}</Chip>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs text-[#55606E]">
                        Region: {account.region_geojson ? 'Scoped' : '—'}
                      </span>
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        loading={deactivatingId === account.id}
                        onClick={() => handleDeactivate(account.id)}
                      >
                        Deactivate
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Panel>

        <div className="space-y-5">
          <Panel title="Provision New Account">
            <form onSubmit={handleProvision} className="space-y-4">
              <Input
                label="Email address"
                type="email"
                placeholder="name@organisation.org"
                value={email}
                onChange={e => setEmail(e.target.value)}
                helper="The address this person will sign in with"
                className="h-9 min-h-0"
                required
              />
              <Input
                label="Label (optional)"
                type="text"
                placeholder="e.g. field-lead-mombasa"
                value={label}
                onChange={e => setLabel(e.target.value)}
                helper="A name to recognise this account by later — never the email, which is never stored"
                className="h-9 min-h-0"
              />
              <SelectField
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
                <label className="block font-normal">
                  <span className={fieldLabelClass}>Region (GeoJSON)</span>
                  <textarea
                    value={regionGeojson}
                    onChange={e => setRegionGeojson(e.target.value)}
                    placeholder='{"type": "Polygon", "coordinates": [...]}'
                    rows={4}
                    required
                    className="block w-full rounded border border-[#EDEFF0] bg-white px-2.5 py-2 font-mono text-sm text-[#232E3D] placeholder:text-[#55606E] focus:border-[#006EB5] focus:outline-none focus:ring-1 focus:ring-[#006EB5]"
                  />
                  <span className="mt-1 block text-xs text-[#55606E]">
                    Scopes this responder to reports within the given area. Required for the responder role.
                  </span>
                </label>
              )}

              {error && <Alert>{error}</Alert>}
              {success && <Alert tone="success">✓ {success}</Alert>}

              <Button type="submit" loading={loading} className="w-full" size="md">
                Provision Account
              </Button>
            </form>
          </Panel>

          <div className="flex gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <ShieldAlert className="mt-0.5 h-4 w-4 flex-shrink-0 text-yellow-800" aria-hidden="true" />
            <p className="text-xs leading-relaxed text-yellow-800">
              <strong>Security notice:</strong> The provisioned user will be able to log in immediately
              via the email OTP flow using this address. Ensure you provision only trusted
              individuals.
            </p>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
