'use client';

import { use, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { analystApi } from '@/lib/api';
import type { AnalystReportDetail, DamageSeverity } from '@/lib/types';
import { formatDate, severityColors, statusColors, priorityColors } from '@/lib/utils';
import { damageMapUrl, directionsUrl, footprintCentre } from '@/lib/mapLinks';
import { Check, ChevronRight, ExternalLink, MapPinOff, TriangleAlert, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Alert,
  Chip,
  LoadingBlock,
  PageContainer,
  Panel,
  SelectField,
} from '@/components/analyst/ui';

// Leaflet touches `window` at import time; load the map in the browser only.
const MatchedBuildingMap = dynamic(() => import('@/components/MatchedBuildingMap'), {
  ssr: false,
  loading: () => <div className="w-full h-48 rounded-lg bg-[#F7F8FA] border border-[#EDEFF0]" />,
});

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
  const [photoSrc, setPhotoSrc] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState(false);

  // Merge review
  const [mergeActing, setMergeActing] = useState(false);

  // Manual merge tool
  const [duplicateOfId, setDuplicateOfId] = useState('');
  const [merging, setMerging] = useState(false);
  const [mergeSuccess, setMergeSuccess] = useState('');

  useEffect(() => {
    analystApi
      .getReport(id)
      .then(setReport)
      .catch(() => setError('Could not load report.'))
      .finally(() => setLoading(false));
  }, [id]);

  const hasPhoto = report?.photo_url && report.photo_status === 'accepted';

  useEffect(() => {
    if (!hasPhoto) return;
    let objectUrl: string | null = null;
    let cancelled = false;
    setPhotoError(false);
    analystApi
      .getReportPhotoBlob(id)
      .then(blob => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setPhotoSrc(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setPhotoError(true);
      });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id, hasPhoto]);

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

  async function confirmPendingMerge() {
    setMergeActing(true);
    try {
      const res = await analystApi.confirmMerge(id);
      setReport(prev => (prev ? { ...prev, status: res.status } : prev));
    } catch {
      setError('Failed to confirm merge.');
    }
    setMergeActing(false);
  }

  async function rejectPendingMerge() {
    setMergeActing(true);
    try {
      const res = await analystApi.rejectMerge(id);
      setReport(prev => (prev ? { ...prev, status: res.status } : prev));
    } catch {
      setError('Failed to reject merge.');
    }
    setMergeActing(false);
  }

  async function handleManualMerge() {
    if (!duplicateOfId.trim()) return;
    setMerging(true);
    setMergeSuccess('');
    try {
      await analystApi.mergeReports(id, duplicateOfId.trim());
      setMergeSuccess(`Report ${duplicateOfId.trim().slice(0, 8)} merged into this report.`);
      setDuplicateOfId('');
    } catch {
      setError('Failed to merge — check the report ID and try again.');
    }
    setMerging(false);
  }

  if (loading) {
    return <LoadingBlock />;
  }

  if (!report) {
    return (
      <PageContainer>
        <p className="text-[#EE402D]">{error || 'Report not found.'}</p>
        <Link href="/analyst/dashboard" className="text-sm text-[#006EB5] mt-2 block hover:underline">
          ← Back to reports
        </Link>
      </PageContainer>
    );
  }

  const details: { label: string; value: React.ReactNode }[] = [
    {
      label: 'Reporter severity',
      value: <Chip className={severityColors[report.damage_severity]}>{report.damage_severity}</Chip>,
    },
    {
      label: 'AI prediction',
      value: report.ai_severity_prediction ? (
        <Chip className={severityColors[report.ai_severity_prediction]}>
          {report.ai_severity_prediction} ({Math.round((report.ai_confidence || 0) * 100)}%)
        </Chip>
      ) : (
        <span className="text-[#55606E]">Pending</span>
      ),
    },
    {
      label: 'Analyst override',
      value: report.analyst_severity_override ? (
        <Chip className={severityColors[report.analyst_severity_override]}>{report.analyst_severity_override}</Chip>
      ) : (
        <span className="text-[#55606E]">—</span>
      ),
    },
    { label: 'Trust tier', value: `Level ${report.reporter_trust_tier}` },
    {
      label: 'Photo status',
      value: <span className="capitalize">{report.photo_status.replace(/_/g, ' ')}</span>,
    },
    {
      label: 'Electricity',
      value: <span className="capitalize">{report.electricity_status?.replace(/_/g, ' ') || '—'}</span>,
    },
    {
      label: 'Health services',
      value: <span className="capitalize">{report.health_services_status || '—'}</span>,
    },
    {
      label: 'Debris clearing',
      value:
        report.debris_clearing_needed === true ? 'Yes' : report.debris_clearing_needed === false ? 'No' : '—',
    },
  ];

  const buildingCentre = footprintCentre(report.footprint_geojson);

  return (
    <PageContainer>
      <nav aria-label="Breadcrumb" className="mb-3 flex items-center gap-1.5 text-sm text-[#55606E]">
        <Link href="/analyst/dashboard" className="font-medium text-[#55606E] hover:text-[#006EB5] transition-colors">
          Reports
        </Link>
        <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="font-mono text-[#232E3D]">{report.id.slice(0, 8).toUpperCase()}</span>
      </nav>

      {/* Report header */}
      <div className="mb-5 rounded-lg border border-[#EDEFF0] bg-white px-4 py-4 sm:px-5">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Chip className={`border ${priorityColors[report.review_priority || 'normal']}`}>
            {report.review_priority || 'normal'} priority
          </Chip>
          <Chip className={statusColors[report.status]}>{report.status.replace(/_/g, ' ')}</Chip>
          {report.ai_divergence && (
            <Chip className="border border-yellow-200 bg-yellow-50 normal-case text-yellow-800">
              <TriangleAlert className="h-3 w-3" aria-hidden="true" /> AI divergence
            </Chip>
          )}
        </div>
        <h1 className="text-xl font-bold capitalize tracking-normal text-[#232E3D] sm:text-2xl">
          {report.crisis_type} — {report.infrastructure_type}
        </h1>
        <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-xs text-[#55606E]">
          <div className="flex gap-1.5">
            <dt>Report ID</dt>
            <dd className="break-all font-mono text-[#232E3D]">{report.id}</dd>
          </div>
          <div className="flex gap-1.5">
            <dt>Submitted</dt>
            <dd className="text-[#232E3D]">{formatDate(report.created_at)}</dd>
          </div>
        </dl>
      </div>

      {error && <Alert className="mb-4">{error}</Alert>}

      {report.status === 'pending_merge_review' && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-[#FBC412]/40 bg-[#FBC412]/10 p-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#232E3D]">Awaiting merge review</p>
            <p className="mt-0.5 text-xs leading-relaxed text-[#55606E]">
              The duplicate-detection system flagged this report as a likely duplicate (composite
              score ≥ 0.9). Confirm to merge it, or reject to keep it as an independent report.
            </p>
          </div>
          <div className="flex flex-shrink-0 gap-2">
            <Button size="sm" variant="secondary" loading={mergeActing} onClick={rejectPendingMerge}>
              Reject
            </Button>
            <Button size="sm" variant="primary" loading={mergeActing} onClick={confirmPendingMerge}>
              Confirm merge
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-3">
        {/* Main info */}
        <div className="space-y-5 lg:col-span-2">
          <Panel title="Report details">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm md:grid-cols-4">
              {details.map(({ label, value }) => (
                <div key={label} className="min-w-0">
                  <dt className="mb-1 text-xs text-[#55606E]">{label}</dt>
                  <dd className="font-medium text-[#232E3D]">{value}</dd>
                </div>
              ))}
            </dl>

            {(report.most_pressing_needs || report.landmark_description || report.lat) && (
              <div className="mt-5 space-y-4 border-t border-[#EDEFF0] pt-4">
                {report.most_pressing_needs && (
                  <div>
                    <p className="mb-1 text-xs text-[#55606E]">Most pressing needs</p>
                    <p className="text-sm leading-relaxed text-[#232E3D]">{report.most_pressing_needs}</p>
                  </div>
                )}

                {report.landmark_description && (
                  <div>
                    <p className="mb-1 text-xs text-[#55606E]">Landmark description</p>
                    <p className="text-sm leading-relaxed text-[#232E3D]">{report.landmark_description}</p>
                  </div>
                )}

                {report.lat && (
                  <div>
                    <p className="mb-1 text-xs text-[#55606E]">GPS coordinates</p>
                    <a
                      href={`https://maps.google.com?q=${report.lat},${report.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-mono text-sm font-medium text-[#006EB5] hover:underline"
                    >
                      {report.lat.toFixed(6)}, {report.lng?.toFixed(6)}
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    </a>
                    {report.gps_accuracy_m && (
                      <span className="ml-2 text-xs text-[#55606E]">(±{report.gps_accuracy_m}m)</span>
                    )}
                  </div>
                )}
              </div>
            )}
          </Panel>

          {/* Photo */}
          {hasPhoto && (
            <Panel title="Photo">
              {photoError ? (
                <div className="bg-[#EDEFF0] rounded aspect-video flex items-center justify-center">
                  <p className="text-sm text-[#55606E]">Could not load photo.</p>
                </div>
              ) : photoSrc ? (
                // eslint-disable-next-line @next/next/no-img-element -- authenticated blob: URL, not a static asset Next's image optimizer can serve
                <img
                  src={photoSrc}
                  alt="Submitted damage photo"
                  className="w-full max-h-[480px] rounded object-contain bg-[#EDEFF0]"
                />
              ) : (
                <div className="bg-[#EDEFF0] rounded aspect-video flex items-center justify-center">
                  <div className="animate-spin w-5 h-5 border-2 border-[#006EB5] border-t-transparent rounded-full" />
                </div>
              )}
            </Panel>
          )}

          {/* Building damage timeline */}
          {!!report.building_timeline?.length && (
            <Panel
              title="Building Damage Timeline"
              description={
                <>
                  Every report ever filed against this building, in chronological order — use this to
                  spot escalation across multiple events or repeated submissions.
                </>
              }
            >
              <ol className="relative border-l border-[#EDEFF0] pl-4 space-y-4">
                {report.building_timeline.map(item => (
                  <li key={item.id} className="relative">
                    <span
                      className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full ${
                        item.id === report.id ? 'bg-[#006EB5]' : 'bg-[#B5D5F5]'
                      }`}
                    />
                    <div className="flex items-center gap-2 flex-wrap">
                      <Chip className={severityColors[item.damage_severity]}>{item.damage_severity}</Chip>
                      <Chip className={statusColors[item.status]}>{item.status.replace(/_/g, ' ')}</Chip>
                      {item.ai_severity_prediction && (
                        <span className="text-xs text-[#55606E]">
                          AI: {item.ai_severity_prediction}
                        </span>
                      )}
                      {item.id === report.id && (
                        <span className="text-xs text-[#006EB5] font-medium">(this report)</span>
                      )}
                    </div>
                    <p className="text-xs text-[#55606E] mt-1">{formatDate(item.created_at)}</p>
                  </li>
                ))}
              </ol>
            </Panel>
          )}

          {/* Notes */}
          <Panel title="Analyst Notes">
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
            <div className="flex items-start gap-2">
              <textarea
                rows={2}
                aria-label="Add a note"
                className="flex-1 rounded border border-[#EDEFF0] px-3 py-2 text-sm focus:border-[#006EB5] focus:outline-none focus:ring-1 focus:ring-[#006EB5]"
                placeholder="Add a note..."
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
              />
              <Button size="sm" loading={addingNote} onClick={addNote} disabled={!noteText.trim()}>
                Add
              </Button>
            </div>
          </Panel>

          {/* Manual merge tool */}
          <Panel
            title="Manual Duplicate Merge"
            description={
              <>
                If you&apos;ve spotted a duplicate the automated scorer missed, mark it as a duplicate
                of this report. This report becomes the surviving (primary) record.
              </>
            }
          >
            {mergeSuccess && (
              <Alert tone="success" className="mb-3 text-xs">
                ✓ {mergeSuccess}
              </Alert>
            )}
            <div className="flex flex-wrap items-start gap-2">
              <div className="min-w-[200px] flex-1">
                <Input
                  aria-label="Duplicate report ID"
                  placeholder="Duplicate report ID (UUID)"
                  value={duplicateOfId}
                  onChange={e => setDuplicateOfId(e.target.value)}
                  className="h-9 min-h-0"
                />
              </div>
              <Button
                size="md"
                className="h-9"
                loading={merging}
                onClick={handleManualMerge}
                disabled={!duplicateOfId.trim()}
              >
                Merge into this report
              </Button>
            </div>
          </Panel>
        </div>

        {/* Actions sidebar */}
        <div className="space-y-5">
          <Panel title="Actions">
            <div className="space-y-3">
              <Button
                variant="primary"
                size="md"
                className="w-full"
                loading={updatingStatus}
                onClick={() => updateStatus('verified')}
                disabled={report.status === 'verified'}
              >
                {!updatingStatus && <Check className="-ml-1 mr-2 h-4 w-4" aria-hidden="true" />}
                Verify report
              </Button>
              <div className="space-y-2 border-t border-[#EDEFF0] pt-3">
                <SelectField
                  label="Rejection reason"
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
                  size="md"
                  className="w-full"
                  loading={updatingStatus}
                  onClick={() => updateStatus('rejected')}
                  disabled={report.status === 'rejected'}
                >
                  {!updatingStatus && <X className="-ml-1 mr-2 h-4 w-4" aria-hidden="true" />}
                  Reject report
                </Button>
              </div>
            </div>
          </Panel>

          <Panel
            title="Severity Override"
            description={
              <>
                Reporter assessed: <strong className="capitalize">{report.damage_severity}</strong>
                {report.ai_severity_prediction && (
                  <>
                    <br />
                    AI prediction: <strong className="capitalize">{report.ai_severity_prediction}</strong>
                  </>
                )}
              </>
            }
          >
            <div className="grid grid-cols-3 gap-2 lg:grid-cols-1 xl:grid-cols-3">
              {(['minimal', 'partial', 'destroyed'] as DamageSeverity[]).map(sev => (
                <button
                  key={sev}
                  type="button"
                  onClick={() => overrideSeverity(sev)}
                  disabled={overridingSeverity || report.analyst_severity_override === sev}
                  aria-pressed={report.analyst_severity_override === sev}
                  className={`w-full rounded px-3 py-2 text-center text-sm font-medium capitalize transition-colors disabled:opacity-50 ${
                    report.analyst_severity_override === sev
                      ? 'bg-[#006EB5] text-white disabled:opacity-100'
                      : 'bg-[#F7F8FA] text-[#232E3D] hover:bg-[#EDEFF0]'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </Panel>

          {report.reporter_building_missing && (
            <div className="flex gap-3 rounded-lg border border-[#FBC412] bg-white p-4">
              <MapPinOff className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#232E3D]" aria-hidden="true" />
              <div>
                <h3 className="mb-1 text-sm font-semibold text-[#232E3D]">Possible mapping gap</h3>
                <p className="text-xs leading-relaxed text-[#55606E]">
                  The reporter says their building is not on the map, so this report was not attached to a nearby
                  building. Export with &quot;not on map only&quot; to share these locations with mappers.
                </p>
              </div>
            </div>
          )}

          {report.building_id && (
            <Panel title="Matched Building">
              {report.footprint_geojson && (
                <div className="relative z-0 mb-3">
                  <MatchedBuildingMap
                    footprintGeojson={report.footprint_geojson}
                    lat={report.lat}
                    lng={report.lng}
                    accuracyM={report.gps_accuracy_m}
                  />
                  <p className="mt-1 text-[11px] text-[#55606E]">
                    Blue with dark outline: the matched building.
                    {report.lat !== null && (
                      <>
                        {' '}Red dot: the reporter&apos;s GPS position
                        {report.gps_accuracy_m !== null && <> (circle: ±{Math.round(report.gps_accuracy_m)} m)</>}.
                      </>
                    )}
                  </p>
                  {buildingCentre && (
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium">
                      <Link href={damageMapUrl(buildingCentre[0], buildingCentre[1], report.building_id)} className="text-[#006EB5] hover:underline">
                        Show on damage map →
                      </Link>
                      <a
                        href={directionsUrl(buildingCentre[0], buildingCentre[1])}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#006EB5] hover:underline"
                      >
                        Directions (Google Maps) ↗
                      </a>
                    </div>
                  )}
                </div>
              )}
              {report.reporter_confirmed_building_id === report.building_id ? (
                <p className="text-xs font-medium text-green-700">Confirmed by the reporter on the map</p>
              ) : (
                report.footprint_match_confidence != null && (
                  <p className="text-xs text-[#232E3D]">
                    Match confidence:{' '}
                    <span className="font-semibold">{Math.round(report.footprint_match_confidence * 100)}%</span>
                    <span className="block mt-0.5 text-[11px] text-[#55606E]">
                      {report.footprint_match_confidence >= 0.8
                        ? 'Likely the right building.'
                        : 'Uncertain: a nearby building may be the right one.'}
                    </span>
                  </p>
                )
              )}
              <p className="mt-2 font-mono text-[11px] text-[#55606E] break-all">{report.building_id}</p>
              {report.reporter_confirmed_building_id && report.reporter_confirmed_building_id !== report.building_id && (
                <p className="mt-2 text-xs text-[#55606E]">
                  The reporter picked a different building, which was too far from their GPS fix to accept.
                </p>
              )}
            </Panel>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
