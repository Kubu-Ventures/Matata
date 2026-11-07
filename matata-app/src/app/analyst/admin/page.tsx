'use client';

import { useEffect, useState } from 'react';
import { MapPin, ShieldAlert, Users } from 'lucide-react';
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
import AreaPicker from '@/components/analyst/AreaPicker';
import { adminApi } from '@/lib/api';
import { boxesToRegion, boxesToText, describeRegion, parseBoxes, regionToBoxes } from '@/lib/area';
import type { AdminAccount } from '@/lib/types';

type AreaMode = 'all' | 'limited';

/**
 * Turn the area inputs into what the API expects: undefined/null for all
 * areas, a GeoJSON string for a limited area, or an error to show.
 */
function resolveArea(role: string, mode: AreaMode, text: string): { region: string | null } | { error: string } {
  if (role === 'admin') return { region: null };
  const limited = role === 'responder' || mode === 'limited';
  if (!limited) return { region: null };
  const { boxes, errors } = parseBoxes(text);
  if (errors.length) return { error: 'Fix the area boxes first: ' + errors.join(' ') };
  if (boxes.length === 0) {
    return {
      error:
        role === 'responder'
          ? 'A responder must be limited to an area. Add at least one box.'
          : 'Add at least one box, or choose "All areas".',
    };
  }
  return { region: boxesToRegion(boxes) };
}

/** Area choice shared by the new-account form and the edit panel. */
function AreaFields({
  name,
  role,
  mode,
  onModeChange,
  text,
  onTextChange,
  customRegion,
}: {
  /** Groups this instance's radio buttons. */
  name: string;
  role: string;
  mode: AreaMode;
  onModeChange: (m: AreaMode) => void;
  text: string;
  onTextChange: (t: string) => void;
  customRegion?: string | null;
}) {
  if (role === 'admin') {
    return <p className="text-xs text-[#55606E]">Admins always cover all areas.</p>;
  }
  const limited = role === 'responder' || mode === 'limited';
  return (
    <fieldset className="space-y-2">
      <legend className={fieldLabelClass}>Area</legend>
      {role === 'analyst' ? (
        <div className="flex gap-4 text-sm text-[#232E3D]">
          <label className="inline-flex items-center gap-1.5">
            <input type="radio" name={name} checked={mode === 'all'} onChange={() => onModeChange('all')} />
            All areas
          </label>
          <label className="inline-flex items-center gap-1.5">
            <input
              type="radio"
              name={name}
              checked={mode === 'limited'}
              onChange={() => onModeChange('limited')}
            />
            Limit to an area
          </label>
        </div>
      ) : (
        <p className="text-xs text-[#55606E]">A responder is always limited to an area.</p>
      )}
      {limited && (
        <>
          <p className="text-xs text-[#55606E]">
            {role === 'responder'
              ? 'They will only see and download reports inside this area.'
              : 'They will only see, verify and download reports inside this area.'}
          </p>
          <AreaPicker value={text} onChange={onTextChange} customRegion={customRegion} />
        </>
      )}
    </fieldset>
  );
}

const ROLE_BADGE: Record<string, string> = {
  admin: 'bg-[#EE402D]/10 text-[#EE402D]',
  analyst: 'bg-[#006EB5]/10 text-[#006EB5]',
  responder: 'bg-green-100 text-green-800',
};

export default function AdminAccountsPage() {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('analyst');
  const [areaMode, setAreaMode] = useState<AreaMode>('all');
  const [areaText, setAreaText] = useState('');
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

  const [areaAccount, setAreaAccount] = useState<AdminAccount | null>(null);
  const [editAreaMode, setEditAreaMode] = useState<AreaMode>('all');
  const [editAreaText, setEditAreaText] = useState('');
  const [editCustomRegion, setEditCustomRegion] = useState<string | null>(null);
  const [savingArea, setSavingArea] = useState(false);
  const [areaError, setAreaError] = useState('');
  const [areaSuccess, setAreaSuccess] = useState('');

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
    setSuccess('');
    setError('');
    const area = resolveArea(role, areaMode, areaText);
    if ('error' in area) {
      setError(area.error);
      return;
    }
    setLoading(true);
    try {
      await adminApi.provisionUser(email, role, area.region ?? undefined, label.trim() || undefined);
      setSuccess(
        `Account provisioned for ${email} with role: ${role}` +
          (area.region ? ', limited to an area' : ''),
      );
      setEmail('');
      setAreaText('');
      setAreaMode('all');
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

  function startEditArea(account: AdminAccount) {
    const boxes = regionToBoxes(account.region_geojson);
    setAreaAccount(account);
    setEditAreaMode(account.region_geojson ? 'limited' : 'all');
    setEditAreaText(boxes ? boxesToText(boxes) : '');
    setEditCustomRegion(boxes ? null : account.region_geojson);
    setAreaError('');
    setAreaSuccess('');
  }

  async function saveArea(e: React.FormEvent) {
    e.preventDefault();
    if (!areaAccount) return;
    setAreaError('');
    setAreaSuccess('');
    let region: string | null;
    if (editCustomRegion && editAreaText.trim() === '' && editAreaMode === 'limited') {
      region = editCustomRegion; // unchanged custom shape
    } else {
      const area = resolveArea(areaAccount.role, editAreaMode, editAreaText);
      if ('error' in area) {
        setAreaError(area.error);
        return;
      }
      region = area.region;
    }
    setSavingArea(true);
    try {
      const updated = await adminApi.updateAccountArea(areaAccount.id, region);
      setAccounts(prev => prev.map(a => (a.id === updated.id ? updated : a)));
      setAreaAccount(updated);
      setAreaSuccess('Area saved. It applies the next time this person signs in.');
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setAreaError(apiErr.message || 'Failed to save the area.');
    } finally {
      setSavingArea(false);
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
        description="Provision analyst and responder accounts, and choose the area each one covers."
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
                    <th className="px-4 py-2.5 font-medium">Area</th>
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
                        <span className="block">{describeRegion(account.region_geojson)}</span>
                        {account.role !== 'admin' && (
                          <button
                            type="button"
                            onClick={() => startEditArea(account)}
                            className="text-xs text-[#006EB5] hover:underline"
                          >
                            Edit area
                          </button>
                        )}
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
                        {describeRegion(account.region_geojson)}
                        {account.role !== 'admin' && (
                          <>
                            {' · '}
                            <button
                              type="button"
                              onClick={() => startEditArea(account)}
                              className="text-[#006EB5] hover:underline"
                            >
                              Edit area
                            </button>
                          </>
                        )}
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
          {areaAccount && (
            <Panel
              title={
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-[#006EB5]" aria-hidden="true" />
                  Area for {areaAccount.label || `${areaAccount.id.slice(0, 8)}…`}
                </span>
              }
              description={`Role: ${areaAccount.role}`}
            >
              <form onSubmit={saveArea} className="space-y-4">
                <AreaFields
                  name="edit-area-mode"
                  role={areaAccount.role}
                  mode={editAreaMode}
                  onModeChange={setEditAreaMode}
                  text={editAreaText}
                  onTextChange={setEditAreaText}
                  customRegion={editCustomRegion}
                />
                {areaError && <Alert>{areaError}</Alert>}
                {areaSuccess && <Alert tone="success">✓ {areaSuccess}</Alert>}
                <div className="flex gap-2">
                  <Button type="submit" loading={savingArea} size="md" className="flex-1">
                    Save area
                  </Button>
                  <Button type="button" variant="secondary" size="md" onClick={() => setAreaAccount(null)}>
                    Close
                  </Button>
                </div>
              </form>
            </Panel>
          )}

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
                  { value: 'analyst', label: 'Analyst — verifies reports' },
                  { value: 'responder', label: 'Responder — view only, limited to an area' },
                  { value: 'admin', label: 'Admin — full administrative access' },
                ]}
                value={role}
                onChange={e => setRole(e.target.value)}
              />

              <AreaFields
                name="new-area-mode"
                role={role}
                mode={areaMode}
                onModeChange={setAreaMode}
                text={areaText}
                onTextChange={setAreaText}
              />

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
