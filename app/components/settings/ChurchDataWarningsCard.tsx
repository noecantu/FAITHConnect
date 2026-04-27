'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';

type WarningItem = {
  id: string;
  source: 'events' | 'service_plans';
  recordId: string;
  title: string;
  message: string;
  fixable: boolean;
};

type WarningsResponse = {
  status: 'ok' | 'warning';
  checkedAt: string;
  warningCount: number;
  warnings: WarningItem[];
  errors?: {
    events: string | null;
    servicePlans: string | null;
  };
};

export default function ChurchDataWarningsCard({ churchId }: { churchId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [data, setData] = useState<WarningsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchWarnings = useCallback(async () => {
    if (!churchId) return;

    setError(null);
    setRefreshing(true);

    try {
      const res = await fetch(`/api/church/${encodeURIComponent(churchId)}/warnings`, {
        credentials: 'include',
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof body?.error === 'string' ? body.error : 'Failed to load data warnings');
      }

      setData(body as WarningsResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data warnings');
      setData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [churchId]);

  useEffect(() => {
    setLoading(true);
    void fetchWarnings();
  }, [fetchWarnings]);

  const getOpenPath = (warning: WarningItem) => {
    if (warning.source === 'events') {
      return `/church/${churchId}/calendar/${warning.recordId}`;
    }

    return `/church/${churchId}/service-plan/${warning.recordId}/edit`;
  };

  const runAction = async (warning: WarningItem, action: 'fix' | 'delete') => {
    setError(null);
    setActingId(warning.id);

    try {
      const res = await fetch(`/api/church/${encodeURIComponent(churchId)}/warnings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action,
          source: warning.source,
          recordId: warning.recordId,
        }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof body?.error === 'string' ? body.error : `Failed to ${action} record`);
      }

      await fetchWarnings();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action} record`);
    } finally {
      setActingId(null);
    }
  };

  return (
    <Card className="relative bg-black/80 border-white/20 backdrop-blur-xl p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">Data Warnings</h3>
          <p className="text-sm text-muted-foreground">
            Detects malformed date/time values in calendar-related records.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => void fetchWarnings()}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Checking data integrity…</p>
      ) : error ? (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </div>
      ) : data?.status === 'ok' ? (
        <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          No data warnings found.
        </div>
      ) : (
        <>
          <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-100 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {data?.warningCount ?? 0} warning{(data?.warningCount ?? 0) === 1 ? '' : 's'} found.
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {(data?.warnings ?? []).map((warning) => (
              <div key={warning.id} className="rounded-md border border-white/15 bg-black/50 p-3">
                <p className="text-sm font-medium text-white/90">{warning.title}</p>
                <p className="text-xs text-white/60">
                  Source: {warning.source} | Record ID: {warning.recordId}
                </p>
                <p className="text-sm text-amber-100 mt-1">{warning.message}</p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(getOpenPath(warning))}
                  >
                    Open Record
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void runAction(warning, 'fix')}
                    disabled={!warning.fixable || actingId === warning.id}
                  >
                    {actingId === warning.id ? 'Working...' : 'Auto-fix'}
                  </Button>

                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (!window.confirm(`Delete \"${warning.title}\"? This cannot be undone.`)) return;
                      void runAction(warning, 'delete');
                    }}
                    disabled={actingId === warning.id}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {data?.checkedAt && (
        <p className="text-xs text-muted-foreground">
          Last checked: {new Date(data.checkedAt).toLocaleString()}
        </p>
      )}
    </Card>
  );
}
