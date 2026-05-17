import React, { useEffect, useMemo, useState } from 'react';
import SectionHeader from './ui/SectionHeader.tsx';
import Card from './ui/Card.tsx';
import { PingTelemetryRecord } from '../types.ts';
import {
  buildPingCsv,
  captureAndPersistPingTelemetry,
  getStoredPingRecords,
  clearPingRecords,
} from '../utils/pingTelemetry.ts';

const CsvDownloadButton: React.FC<{ rows: PingTelemetryRecord[]; disabled: boolean }> = ({ rows, disabled }) => {
  const trigger = () => {
    if (!rows.length) return;
    const csv = buildPingCsv(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    link.href = URL.createObjectURL(blob);
    link.download = `ping_telemetry_${timestamp}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <button
      type="button"
      onClick={trigger}
      disabled={disabled}
      className="rounded-full border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed border-sky-300 bg-sky-50 text-sky-800 hover:bg-sky-100"
    >
      Export CSV
    </button>
  );
};

const PingTelemetryProbe: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<PingTelemetryRecord[]>([]);
  const [latestRow, setLatestRow] = useState<PingTelemetryRecord | null>(null);

  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const isJsonMode = params.get('format') === 'json';

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const hit = await captureAndPersistPingTelemetry();

        const latest = await getStoredPingRecords();
        if (!mounted) return;

        setRows(latest);
        setLatestRow(hit);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : 'Failed to capture telemetry.');
      } finally {
        if (!mounted) return;
        setIsLoading(false);
      }
    };

    void load();

    return () => {
      mounted = false;
    };
  }, []);

  const clearAll = async () => {
    await clearPingRecords();
    const latest = await getStoredPingRecords();
    setRows(latest);
    setLatestRow(null);
  };

  const jsonPayload = JSON.stringify(rows, null, 2);

  if (isJsonMode) {
    return (
      <pre className="mx-auto max-w-5xl p-4 text-xs whitespace-pre-wrap">{isLoading ? 'collecting...' : jsonPayload || '[]'}</pre>
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl p-4 sm:p-6">
      <SectionHeader
        title="No-Fee Cloudflare Access Telemetry"
        subtitle="Per-hit capture from browser requests. This records public IP, geo approximation, and device metadata."
      />

      <Card className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-700">
            {isLoading ? 'Collecting hit details…' : `Recorded ${rows.length} hit(s) in local browser database.`}
          </p>
          <div className="flex gap-2">
            <CsvDownloadButton rows={rows} disabled={isLoading || rows.length === 0} />
            <button
              type="button"
              onClick={clearAll}
              className="rounded-full border px-3 py-1.5 text-xs font-semibold transition border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100"
            >
              Clear Local Records
            </button>
          </div>
        </div>
        {error ? <p className="mt-2 text-sm text-rose-700">{error}</p> : null}
      </Card>

      {latestRow ? (
        <Card className="mb-6">
          <h2 className="text-lg font-semibold text-slate-900">Latest hit</h2>
          <dl className="mt-3 grid grid-cols-1 gap-2 text-sm text-slate-700 sm:grid-cols-2 lg:grid-cols-3">
            <div><dt className="font-semibold">IP</dt><dd>{latestRow.sourceIp}</dd></div>
            <div><dt className="font-semibold">Location</dt><dd>{latestRow.city}, {latestRow.region}, {latestRow.country} ({latestRow.countryCode}) {latestRow.postalCode}</dd></div>
            <div><dt className="font-semibold">Timezone</dt><dd>{latestRow.timezone}</dd></div>
            <div><dt className="font-semibold">ASN / Org</dt><dd>{latestRow.asn} / {latestRow.org}</dd></div>
            <div><dt className="font-semibold">Owner (best effort)</dt><dd>{latestRow.owner}</dd></div>
            <div><dt className="font-semibold">Device</dt><dd>{latestRow.deviceType} / {latestRow.os} / {latestRow.browser}</dd></div>
            <div><dt className="font-semibold">Model</dt><dd>{latestRow.deviceModel || 'Unknown'}</dd></div>
            <div><dt className="font-semibold">Path</dt><dd>{latestRow.path}</dd></div>
            <div><dt className="font-semibold">Time</dt><dd>{new Date(latestRow.timestamp).toLocaleString()}</dd></div>
          </dl>
          <p className="mt-3 text-xs text-slate-500">Physical address note: {latestRow.physicalAddressNote}</p>
          <p className="mt-1 text-xs text-slate-500">UA: {latestRow.userAgent}</p>
        </Card>
      ) : null}

      <Card>
        <h2 className="text-lg font-semibold text-slate-900">Recent hits</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="text-left text-slate-600 uppercase">
                <th className="px-2 py-2">When</th>
                <th className="px-2 py-2">IP</th>
                <th className="px-2 py-2">City/Region</th>
                <th className="px-2 py-2">Country</th>
                <th className="px-2 py-2">ASN</th>
                <th className="px-2 py-2">Device</th>
                <th className="px-2 py-2">Path</th>
                <th className="px-2 py-2">Owner</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-slate-200">
                  <td className="px-2 py-2">{new Date(row.timestamp).toLocaleString()}</td>
                  <td className="px-2 py-2">{row.sourceIp}</td>
                  <td className="px-2 py-2">{row.city}/{row.region}</td>
                  <td className="px-2 py-2">{row.country}</td>
                  <td className="px-2 py-2">{row.asn}</td>
                  <td className="px-2 py-2">{row.deviceType} / {row.os} / {row.browser}</td>
                  <td className="px-2 py-2">{row.path}</td>
                  <td className="px-2 py-2">{row.owner}</td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td className="px-2 py-4 text-slate-500" colSpan={8}>No rows yet.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>
    </main>
  );
};

export default PingTelemetryProbe;
