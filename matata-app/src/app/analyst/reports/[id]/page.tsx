'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { analystApi } from '@/lib/api';
import type { AnalystReportDetail, DamageSeverity } from '@/lib/types';
import { formatDate, severityColors, statusColors, priorityColors } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';

export default function AnalystReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [report, setReport] = useState<AnalystReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [noteText, setNoteText] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [overridingSeverity, setOverridingSeverity] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('inaccurate');
  const [error, setError] = useState('');

  useEffect(() => {
    analystApi
      .getReport(id)
      .then(setReport)
      .catch(() => setError('Could not load report.'))
      .finally(() => setLoading(false));
  }, [id]);

  async function updateStatus(status: string) {
    setUpdatingStatus(true);
    try {
      await analystApi.updateStatus(id, status, status === 'rejected' ? rejectionReason : undefined);
      setReport(prev => prev ? { ...prev, status: status as AnalystReportDetail['status'] } : prev);
    } catch {
      setError('Failed to update status.');
    }
    setUpdatingStatus(false);
  }

  async function overrideSeverity(severity: string) {
    setOverridingSeverity(true);
    try {
      await analystApi.overrideSeverity(id, severity);
      setReport(prev =>
        prev ? { ...prev, analyst_severity_override: severity as DamageSeverity } : prev
      );
    } catch {
      setError('Failed to override severity.');
    }
    setOverridingSeverity(false);
  }

  async function addNote() {
    if (!noteText.trim()) return;
    setAddingNote(true);
    try {
      await analystApi.addNote(id, noteText.trim());
      setReport(prev =>
        prev
          ? {
              ...prev,
              notes: [
                ...(prev.notes || []),
                {
                  id: Date.now().toString(),
                  body: noteText.trim(),
                  created_at: new Date().toISOString(),
                },
              ],
            }
          : prev
      );
      setNoteText('');
    } catch {
      setError('Failed to add note.');
    }
    setAddingNote(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin w-6 h-6 border-2 border-[#006EB5] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-6">
        <p className="text-[#EE402D]">{error || 'Report not found.'}</p>
        <Link href="/analyst/dashboard" className="text-sm text-[#006EB5] mt-2 block hover:underline">
          ← Back to reports
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center gap-2 text-sm text-[#55606E] mb-6">
        <Link href="/analyst/dashboard" className="hover:text-[#006EB5] transition-colors">
          Reports
        </Link>
        <span>/</span>
        <span className="font-mono text-[#232E3D]">{report.id.slice(0, 8).toUpperCase()}</span>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
          <p className="text-sm text-[#EE402D]">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg border border-[#EDEFF0] p-6">
            <div className="mb-4">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span
                  className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium capitalize ${priorityColors[report.review_priority || 'normal']}`}
                >
                  {report.review_priority || 'normal'} priority
                </span>
                <span
                  className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium capitalize ${statusColors[report.status]}`}
                >
                  {report.status.replace(/_/g, ' ')}
                </span>
                {report.ai_divergence && (
                  <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium bg-yellow-50 text-yellow-800 border border-yellow-200">
                    ⚠ AI divergence
                  </span>
                )}
              </div>
              <h1 className="text-lg font-bold text-[#232E3D] capitalize">
                {report.crisis_type} — {report.infrastructure_type}
              </h1>
            </div>

            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
              {[
                {
                  label: 'Report ID',
                  value: <span className="font-mono text-xs break-all">{report.id}</span>,
                },
                { label: 'Submitted', value: formatDate(report.created_at) },
                {
                  label: 'Reporter severity',
                  value: (
                    <span
                      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium capitalize ${severityColors[report.damage_severity]}`}
                    >
                      {report.damage_severity}
                    </span>
                  ),
                },
                {
                  label: 'AI prediction',
                  value: report.ai_severity_prediction ? (
                    <span
                      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium capitalize ${severityColors[report.ai_severity_prediction]}`}
                    >
                      {report.ai_severity_prediction} (
                      {Math.round((report.ai_confidence || 0) * 100)}%)
                    </span>
                  ) : (
                    <span className="text-[#55606E]">Pending</span>
                  ),
                },
                {
                  label: 'Analyst override',
                  value: report.analyst_severity_override ? (
                    <span
                      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium capitalize ${severityColors[report.analyst_severity_override]}`}
                    >
                      {report.analyst_severity_override}
                    </span>
                  ) : (
                    <span className="text-[#55606E]">—</span>
                  ),
                },
                { label: 'Trust tier', value: `Level ${report.reporter_trust_tier}` },
                {
                  label: 'Photo status',
                  value: (
                    <span className="capitalize">
                      {report.photo_status.replace(/_/g, ' ')}
                    </span>
                  ),
                },
                {
                  label: 'Electricity',
                  value: (
                    <span className="capitalize">
                      {report.electricity_status?.replace(/_/g, ' ') || '—'}
                    </span>
                  ),
                },
                {
                  label: 'Health services',
                  value: (
                    <span className="capitalize">{report.health_services_status || '—'}</span>
                  ),
                },
                {
                  label: 'Debris clearing',
                  value:
                    report.debris_clearing_needed === true
                      ? 'Yes'
                      : report.debris_clearing_needed === false
                      ? 'No'
                      : '—',
                },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-[#55606E] mb-0.5">{label}</p>
                  <div className="text-[#232E3D] font-medium">{value}</div>
                </div>
              ))}
            </div>

            {report.most_pressing_needs && (
              <div className="mt-4 pt-4 border-t border-[#EDEFF0]">
                <p className="text-xs text-[#55606E] mb-1">Most pressing needs</p>
                <p className="text-sm text-[#232E3D]">{report.most_pressing_needs}</p>
              </div>
            )}

            {report.landmark_description && (
              <div className="mt-3">
                <p className="text-xs text-[#55606E] mb-1">Landmark description</p>
                <p className="text-sm text-[#232E3D]">{report.landmark_description}</p>
              </div>
            )}

            {report.lat && (
              <div className="mt-3">
                <p className="text-xs text-[#55606E] mb-1">GPS coordinates</p>
                <a
                  href={`https://maps.google.com?q=${report.lat},${report.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[#006EB5] hover:underline font-mono"
                >
                  {report.lat.toFixed(6)}, {report.lng?.toFixed(6)}
                </a>
                {report.gps_accuracy_m && (
                  <span className="text-xs text-[#55606E] ml-2">(±{report.gps_accuracy_m}m)</span>
                )}
              </div>
            )}
          </div>

          {/* Photo */}
          {report.photo_url && report.photo_status === 'accepted' && (
            <div className="bg-white rounded-lg border border-[#EDEFF0] p-6">
              <h3 className="font-medium text-[#232E3D] mb-3 text-sm">Photo</h3>
              <div className="bg-[#EDEFF0] rounded aspect-video flex items-center justify-center">
                <p className="text-sm text-[#55606E]">Photo: {report.photo_url}</p>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="bg-white rounded-lg border border-[#EDEFF0] p-6">
            <h3 className="font-medium text-[#232E3D] mb-4 text-sm">Analyst Notes</h3>
            {(report.notes || []).length === 0 ? (
              <p className="text-sm text-[#55606E] mb-4">No notes yet.</p>
            ) : (
              <div className="space-y-3 mb-4">
                {(report.notes || []).map(note => (
                  <div key={note.id} className="bg-[#F7F8FA] rounded p-3">
                    <p className="text-sm text-[#232E3D]">{note.body}</p>
                    <p className="text-xs text-[#55606E] mt-1">{formatDate(note.created_at)}</p>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <textarea
                rows={2}
                className="flex-1 rounded border border-[#EDEFF0] px-3 py-2 text-sm focus:border-[#006EB5] focus:outline-none focus:ring-1 focus:ring-[#006EB5]"
                placeholder="Add a note..."
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
              />
              <Button size="sm" loading={addingNote} onClick={addNote} disabled={!noteText.trim()}>
                Add
              </Button>
            </div>
          </div>
        </div>

        {/* Actions sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-[#EDEFF0] p-5">
            <h3 className="font-medium text-[#232E3D] mb-4 text-sm">Actions</h3>
            <div className="space-y-2">
              <Button
                variant="primary"
                size="sm"
                className="w-full justify-start"
                loading={updatingStatus}
                onClick={() => updateStatus('verified')}
                disabled={report.status === 'verified'}
              >
                ✅ Verify report
              </Button>
              <div className="space-y-1.5">
                <Select
                  options={[
                    { value: 'inaccurate', label: 'Inaccurate information' },
                    { value: 'duplicate', label: 'Duplicate report' },
                    { value: 'poor_quality', label: 'Poor quality' },
                    { value: 'out_of_scope', label: 'Out of scope' },
                    { value: 'other', label: 'Other' },
                  ]}
                  placeholder="Rejection reason"
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                />
                <Button
                  variant="danger"
                  size="sm"
                  className="w-full justify-start"
                  loading={updatingStatus}
                  onClick={() => updateStatus('rejected')}
                  disabled={report.status === 'rejected'}
                >
                  ✗ Reject report
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-[#EDEFF0] p-5">
            <h3 className="font-medium text-[#232E3D] mb-4 text-sm">Severity Override</h3>
            <p className="text-xs text-[#55606E] mb-3">
              Reporter assessed:{' '}
              <strong className="capitalize">{report.damage_severity}</strong>
              {report.ai_severity_prediction && (
                <>
                  <br />
                  AI prediction:{' '}
                  <strong className="capitalize">{report.ai_severity_prediction}</strong>
                </>
              )}
            </p>
            <div className="space-y-2">
              {(['minimal', 'partial', 'destroyed'] as DamageSeverity[]).map(sev => (
                <button
                  key={sev}
                  type="button"
                  onClick={() => overrideSeverity(sev)}
                  disabled={overridingSeverity || report.analyst_severity_override === sev}
                  className={`w-full px-3 py-2 rounded text-sm font-medium text-left capitalize transition-colors disabled:opacity-50 ${
                    report.analyst_severity_override === sev
                      ? 'bg-[#006EB5] text-white'
                      : 'bg-[#F7F8FA] text-[#232E3D] hover:bg-[#EDEFF0]'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          {report.building_id && (
            <div className="bg-white rounded-lg border border-[#EDEFF0] p-5">
              <h3 className="font-medium text-[#232E3D] mb-2 text-sm">Matched Building</h3>
              <p className="font-mono text-xs text-[#55606E] break-all">{report.building_id}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
