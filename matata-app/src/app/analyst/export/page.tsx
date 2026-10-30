'use client';

import { useState } from 'react';
import { Download, FileSpreadsheet, Globe, Layers, ShieldCheck, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { exportApi } from '@/lib/api';
import type { ExportFormat } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  Alert,
  PageContainer,
  PageHeader,
  Panel,
  SelectField,
  Spinner,
  checkboxClass,
  fieldInputClass,
  fieldLabelClass,
} from '@/components/analyst/ui';

type ExportStatus = 'idle' | 'requesting' | 'processing' | 'downloading' | 'done' | 'error';

const STATUS_LABEL: Record<ExportStatus, string> = {
  idle: '',
  requesting: 'Requesting export…',
  processing: 'Processing on the server — large exports run asynchronously, this can take a minute…',
  downloading: 'Downloading file…',
  done: 'Download complete.',
  error: 'Export failed. Please try again.',
};

const FILE_EXT: Record<ExportFormat, string> = {
  geojson: 'geojson',
  csv: 'csv',
  shapefile: 'zip',
};

const FORMATS: { value: ExportFormat; name: string; hint: string; icon: LucideIcon }[] = [
  { value: 'geojson', name: 'GeoJSON', hint: 'for GIS tools', icon: Globe },
  { value: 'csv', name: 'CSV', hint: 'for spreadsheets', icon: FileSpreadsheet },
  { value: 'shapefile', name: 'Shapefile', hint: 'for ArcGIS/QGIS', icon: Layers },
];

export default function ExportPage() {
  const [format, setFormat] = useState<ExportFormat>('geojson');
  const [status, setStatus] = useState<ExportStatus>('idle');
  const [includeFootprints, setIncludeFootprints] = useState(false);
  const [notOnMapOnly, setNotOnMapOnly] = useState(false);

  const [filters, setFilters] = useState({
    crisis_type: '',
    damage_severity: '',
    status: 'verified',
    time_from: '',
    time_to: '',
    min_ai_confidence: '',
  });

  function setFilter(key: keyof typeof filters, val: string) {
    setFilters(prev => ({ ...prev, [key]: val }));
  }

  async function handleExport() {
    setStatus('requesting');
    try {
      const params: Record<string, string> = {};
      if (filters.crisis_type) params.crisis_type = filters.crisis_type;
      if (filters.damage_severity) params.damage_severity = filters.damage_severity;
      if (filters.status) params.status = filters.status;
      if (filters.time_from) params.time_from = new Date(filters.time_from).toISOString();
      if (filters.time_to) params.time_to = new Date(filters.time_to).toISOString();
      if (filters.min_ai_confidence) params.min_ai_confidence = filters.min_ai_confidence;
      if (format === 'geojson' && includeFootprints) params.include_footprints = 'true';
      if (notOnMapOnly) params.not_on_map_only = 'true';

      const blob = await exportApi.download(format, params, s => setStatus(s));

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `matata-export-${new Date().toISOString().slice(0, 10)}.${FILE_EXT[format]}`;
      a.click();
      URL.revokeObjectURL(url);
      setStatus('done');
    } catch {
      setStatus('error');
    }
  }

  const isBusy = status === 'requesting' || status === 'processing' || status === 'downloading';

  return (
    <PageContainer narrow>
      <PageHeader
        title="Export Data"
        description={
          <>
            Download report data for operational planning. Exports over 10,000 records are processed
            asynchronously on the server — this page will wait and download automatically once ready.
          </>
        }
      />

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Panel title="1. Format">
            <div role="radiogroup" aria-label="Export format" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {FORMATS.map(f => {
                const selected = format === f.value;
                const Icon = f.icon;
                return (
                  <button
                    key={f.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setFormat(f.value)}
                    className={cn(
                      'flex items-center gap-3 rounded-md border px-3 py-3 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-[#006EB5] focus:ring-offset-1',
                      selected
                        ? 'border-[#006EB5] bg-[#006EB5]/5'
                        : 'border-[#EDEFF0] bg-white hover:bg-[#F7F8FA]'
                    )}
                  >
                    <Icon
                      className={cn('h-5 w-5 flex-shrink-0', selected ? 'text-[#006EB5]' : 'text-[#55606E]')}
                      aria-hidden="true"
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-[#232E3D]">{f.name}</span>
                      <span className="block text-xs text-[#55606E]">{f.hint}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            {format === 'geojson' && (
              <label className="mt-4 flex items-center gap-2 font-normal">
                <input
                  type="checkbox"
                  checked={includeFootprints}
                  onChange={e => setIncludeFootprints(e.target.checked)}
                  className={checkboxClass}
                />
                <span className="text-sm text-[#232E3D]">Include building footprint polygons</span>
              </label>
            )}
          </Panel>

          <Panel title="2. Filters">
            <div className="space-y-4">
              <label className="flex items-start gap-2 font-normal">
                <input
                  type="checkbox"
                  checked={notOnMapOnly}
                  onChange={e => setNotOnMapOnly(e.target.checked)}
                  className={cn(checkboxClass, 'mt-0.5')}
                />
                <span className="text-sm text-[#232E3D]">
                  Only reports where the building isn&apos;t on the map
                  <span className="block text-xs text-[#55606E]">
                    A layer of possible mapping gaps to share with OpenStreetMap mappers.
                  </span>
                </span>
              </label>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <SelectField
                  label="Status"
                  options={[
                    { value: 'verified', label: 'Verified only' },
                    { value: 'pending', label: 'Pending only' },
                    { value: 'verified,pending', label: 'Verified + Pending' },
                    { value: '', label: 'All statuses' },
                  ]}
                  value={filters.status}
                  onChange={e => setFilter('status', e.target.value)}
                />
                <SelectField
                  label="Crisis type"
                  options={[
                    { value: 'flood', label: 'Flood' },
                    { value: 'earthquake', label: 'Earthquake' },
                    { value: 'conflict', label: 'Conflict' },
                    { value: 'fire', label: 'Fire' },
                    { value: 'wildfire', label: 'Wildfire' },
                    { value: 'other', label: 'Other' },
                  ]}
                  placeholder="All crises"
                  value={filters.crisis_type}
                  onChange={e => setFilter('crisis_type', e.target.value)}
                />
                <SelectField
                  label="Severity"
                  options={[
                    { value: 'minimal', label: 'Minimal' },
                    { value: 'partial', label: 'Partial' },
                    { value: 'destroyed', label: 'Destroyed' },
                  ]}
                  placeholder="All severities"
                  value={filters.damage_severity}
                  onChange={e => setFilter('damage_severity', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <label className="block font-normal">
                  <span className={fieldLabelClass}>From</span>
                  <input
                    type="date"
                    value={filters.time_from}
                    onChange={e => setFilter('time_from', e.target.value)}
                    className={fieldInputClass}
                  />
                </label>
                <label className="block font-normal">
                  <span className={fieldLabelClass}>To</span>
                  <input
                    type="date"
                    value={filters.time_to}
                    onChange={e => setFilter('time_to', e.target.value)}
                    className={fieldInputClass}
                  />
                </label>
              </div>
            </div>
          </Panel>
        </div>

        <div className="space-y-5 lg:sticky lg:top-32">
          <Panel title="3. Download">
            {status !== 'idle' && (
              <Alert
                tone={status === 'error' ? 'error' : status === 'done' ? 'success' : 'info'}
                className="mb-3 flex items-center gap-2"
              >
                {isBusy && <Spinner className="h-3.5 w-3.5 flex-shrink-0" />}
                <span>{STATUS_LABEL[status]}</span>
              </Alert>
            )}

            <Button loading={isBusy} onClick={handleExport} className="w-full" size="lg">
              {!isBusy && <Download className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />}
              Download {format.toUpperCase()}
            </Button>
          </Panel>

          <div className="flex gap-3 rounded-lg border border-[#B5D5F5] bg-[#B5D5F5]/20 p-4">
            <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#006EB5]" aria-hidden="true" />
            <p className="text-xs leading-relaxed text-[#232E3D]">
              <strong>Note:</strong> Reporter PII is stripped from all exports at the service layer,
              regardless of filters applied — this cannot be bypassed via the dashboard or API.
            </p>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
