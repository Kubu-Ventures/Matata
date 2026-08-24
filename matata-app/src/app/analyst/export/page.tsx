'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { exportApi } from '@/lib/api';
import type { ExportFormat } from '@/lib/types';

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

export default function ExportPage() {
  const [format, setFormat] = useState<ExportFormat>('geojson');
  const [status, setStatus] = useState<ExportStatus>('idle');
  const [includeFootprints, setIncludeFootprints] = useState(false);

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
    <div className="p-6 max-w-xl">
      <h1 className="text-xl font-bold text-[#232E3D] mb-2">Export Data</h1>
      <p className="text-sm text-[#55606E] mb-6">
        Download report data for operational planning. Exports over 10,000 records are processed
        asynchronously on the server — this page will wait and download automatically once ready.
      </p>

      <div className="bg-white rounded-lg border border-[#EDEFF0] p-6 space-y-4">
        <Select
          label="Export format"
          options={[
            { value: 'geojson', label: 'GeoJSON — for GIS tools' },
            { value: 'csv', label: 'CSV — for spreadsheets' },
            { value: 'shapefile', label: 'Shapefile — for ArcGIS/QGIS' },
          ]}
          value={format}
          onChange={e => setFormat(e.target.value as ExportFormat)}
        />

        {format === 'geojson' && (
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={includeFootprints}
              onChange={e => setIncludeFootprints(e.target.checked)}
              className="rounded border-[#EDEFF0] text-[#006EB5] focus:ring-[#006EB5]"
            />
            <span className="text-sm text-[#232E3D]">Include building footprint polygons</span>
          </label>
        )}

        <div className="pt-2 border-t border-[#EDEFF0] space-y-3">
          <p className="text-xs font-medium text-[#55606E] uppercase tracking-wide">Filters</p>

          <Select
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

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Crisis type"
              options={[
                { value: 'flood', label: 'Flood' },
                { value: 'earthquake', label: 'Earthquake' },
                { value: 'conflict', label: 'Conflict' },
                { value: 'wildfire', label: 'Wildfire' },
                { value: 'other', label: 'Other' },
              ]}
              placeholder="All crises"
              value={filters.crisis_type}
              onChange={e => setFilter('crisis_type', e.target.value)}
            />
            <Select
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

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-[#55606E]">From</span>
              <input
                type="date"
                value={filters.time_from}
                onChange={e => setFilter('time_from', e.target.value)}
                className="rounded border border-[#EDEFF0] px-2.5 py-1.5 text-sm focus:border-[#006EB5] focus:outline-none focus:ring-1 focus:ring-[#006EB5]"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-[#55606E]">To</span>
              <input
                type="date"
                value={filters.time_to}
                onChange={e => setFilter('time_to', e.target.value)}
                className="rounded border border-[#EDEFF0] px-2.5 py-1.5 text-sm focus:border-[#006EB5] focus:outline-none focus:ring-1 focus:ring-[#006EB5]"
              />
            </label>
          </div>
        </div>

        {status !== 'idle' && (
          <div
            className={`rounded p-3 flex items-center gap-2 ${
              status === 'error'
                ? 'bg-red-50 border border-red-200'
                : status === 'done'
                ? 'bg-green-50 border border-green-200'
                : 'bg-[#B5D5F5]/20 border border-[#B5D5F5]'
            }`}
          >
            {isBusy && (
              <div className="w-3.5 h-3.5 flex-shrink-0 animate-spin border-2 border-[#006EB5] border-t-transparent rounded-full" />
            )}
            <p
              className={`text-sm ${
                status === 'error' ? 'text-[#EE402D]' : status === 'done' ? 'text-green-800' : 'text-[#232E3D]'
              }`}
            >
              {STATUS_LABEL[status]}
            </p>
          </div>
        )}

        <Button loading={isBusy} onClick={handleExport} className="w-full" size="lg">
          Download {format.toUpperCase()}
        </Button>
      </div>

      <div className="mt-4 p-4 bg-[#B5D5F5]/20 rounded-lg border border-[#B5D5F5]">
        <p className="text-xs text-[#232E3D]">
          <strong>Note:</strong> Reporter PII is stripped from all exports at the service layer,
          regardless of filters applied — this cannot be bypassed via the dashboard or API.
        </p>
      </div>
    </div>
  );
}
