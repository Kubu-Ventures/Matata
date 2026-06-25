'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://157.173.121.74:8000/api/v1';

export default function ExportPage() {
  const [format, setFormat] = useState('geojson');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleExport() {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('matata_token');
      const res = await fetch(`${BASE_URL}/export/${format}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `matata-export-${new Date().toISOString().slice(0, 10)}.${
        format === 'geojson' ? 'geojson' : format === 'csv' ? 'csv' : 'zip'
      }`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Export failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-xl font-bold text-[#232E3D] mb-2">Export Data</h1>
      <p className="text-sm text-[#55606E] mb-6">
        Download verified report data for operational planning.
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
          onChange={e => setFormat(e.target.value)}
        />

        {error && <p className="text-sm text-[#EE402D]">{error}</p>}

        <Button loading={loading} onClick={handleExport} className="w-full" size="lg">
          Download {format.toUpperCase()}
        </Button>
      </div>

      <div className="mt-4 p-4 bg-[#B5D5F5]/20 rounded-lg border border-[#B5D5F5]">
        <p className="text-xs text-[#232E3D]">
          <strong>Note:</strong> Exports contain verified reports only. Reporter PII is stripped from
          all exports. Large exports are processed asynchronously and a download link will be
          provided.
        </p>
      </div>
    </div>
  );
}
