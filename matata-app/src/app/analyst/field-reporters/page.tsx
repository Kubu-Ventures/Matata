'use client';

import { useEffect, useState } from 'react';
import { analystApi } from '@/lib/api';
import type { FieldReporterSummaryItem } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import {
  Alert,
  EmptyState,
  LoadingBlock,
  PageContainer,
  PageHeader,
  Panel,
  fieldInputClass,
  fieldLabelClass,
} from '@/components/analyst/ui';

/** Monday of the current week, as YYYY-MM-DD in local time. */
function startOfWeek(): string {
  const d = new Date();
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return d.toISOString().slice(0, 10);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Inclusive date range → [from 00:00, day after `to` 00:00) in UTC ISO. */
function toParams(from: string, to: string) {
  const params: { date_from?: string; date_to?: string } = {};
  if (from) params.date_from = new Date(`${from}T00:00:00`).toISOString();
  if (to) {
    const end = new Date(`${to}T00:00:00`);
    end.setDate(end.getDate() + 1);
    params.date_to = end.toISOString();
  }
  return params;
}

export default function FieldReportersPage() {
  const [from, setFrom] = useState(startOfWeek);
  const [to, setTo] = useState(today);
  const [items, setItems] = useState<FieldReporterSummaryItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    analystApi
      .fieldReporterSummary(toParams(from, to))
      .then(res => {
        if (!cancelled) {
          setItems(res.items);
          setError('');
        }
      })
      .catch(() => {
        if (!cancelled) setError('Could not load the field reporter summary.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [from, to]);

  function changeFrom(value: string) {
    setLoading(true);
    setFrom(value);
  }

  function changeTo(value: string) {
    setLoading(true);
    setTo(value);
  }

  async function downloadCsv() {
    setDownloading(true);
    try {
      const blob = await analystApi.fieldReporterSummaryCsv(toParams(from, to));
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `field-reporters_${from}_to_${to}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Could not download the CSV.');
    }
    setDownloading(false);
  }

  const totals = (items || []).reduce(
    (acc, r) => ({
      total: acc.total + r.total,
      verified: acc.verified + r.verified,
      pending: acc.pending + r.pending,
      rejected: acc.rejected + r.rejected,
      duplicate: acc.duplicate + r.duplicate,
    }),
    { total: 0, verified: 0, pending: 0, rejected: 0, duplicate: 0 },
  );

  return (
    <PageContainer>
      <PageHeader
        title="Field Reporters"
        description="Reports sent by each registered field reporter code, by review outcome. Use the verified count for payment. Names and phone numbers are not stored in Matata."
      />

      <Panel title="Period">
        <div className="flex flex-wrap items-end gap-3">
          <label className="block">
            <span className={fieldLabelClass}>From</span>
            <input type="date" className={fieldInputClass} value={from} onChange={e => changeFrom(e.target.value)} />
          </label>
          <label className="block">
            <span className={fieldLabelClass}>To (inclusive)</span>
            <input type="date" className={fieldInputClass} value={to} onChange={e => changeTo(e.target.value)} />
          </label>
          <Button size="sm" variant="secondary" loading={downloading} onClick={downloadCsv}>
            Download CSV
          </Button>
        </div>
      </Panel>

      {error && <Alert className="my-4">{error}</Alert>}

      <div className="mt-5">
        {loading ? (
          <LoadingBlock />
        ) : !items || items.length === 0 ? (
          <EmptyState title="No field reporters registered">
            Register one on the server with{' '}
            <code className="font-mono">python -m app.cli add-field-reporter --email &lt;their email&gt; --code KIB-01</code>
          </EmptyState>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-[#EDEFF0] bg-white">
            <table className="w-full text-sm">
              <thead className="bg-[#F7F8FA] text-left text-xs font-medium text-[#55606E]">
                <tr>
                  {['Code', 'Sent', 'Verified', 'Pending', 'Rejected', 'Duplicate'].map(h => (
                    <th key={h} className="px-4 py-2.5">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map(r => (
                  <tr key={r.code} className="border-t border-[#EDEFF0]">
                    <td className="px-4 py-2.5 font-mono font-medium text-[#232E3D]">{r.code}</td>
                    <td className="px-4 py-2.5 tabular-nums">{r.total}</td>
                    <td className="px-4 py-2.5 tabular-nums font-semibold text-green-700">{r.verified}</td>
                    <td className="px-4 py-2.5 tabular-nums">{r.pending}</td>
                    <td className="px-4 py-2.5 tabular-nums">{r.rejected}</td>
                    <td className="px-4 py-2.5 tabular-nums">{r.duplicate}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-[#EDEFF0] font-semibold">
                  <td className="px-4 py-2.5">Total</td>
                  <td className="px-4 py-2.5 tabular-nums">{totals.total}</td>
                  <td className="px-4 py-2.5 tabular-nums text-green-700">{totals.verified}</td>
                  <td className="px-4 py-2.5 tabular-nums">{totals.pending}</td>
                  <td className="px-4 py-2.5 tabular-nums">{totals.rejected}</td>
                  <td className="px-4 py-2.5 tabular-nums">{totals.duplicate}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
