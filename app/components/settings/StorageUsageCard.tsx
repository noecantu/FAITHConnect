'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';

interface Props {
  storageUsed: number | null;
  hasLoaded: boolean;
  quotaBytes?: number; // optional, default provided below
  onRefresh?: () => void; // optional refresh callback
  refreshing?: boolean; // parent controls spinner
}

export default function StorageUsageCard({
  storageUsed,
  hasLoaded,
  quotaBytes = 1_000_000_000,
  onRefresh,
  refreshing = false,
}: Props) {
  const percent = storageUsed
    ? Math.min((storageUsed / quotaBytes) * 100, 100)
    : 0;

  return (
    <Card className="relative bg-black/30 border-white/20 backdrop-blur-xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Database Storage</CardTitle>
          <CardDescription>
            Organization Storage Usage
          </CardDescription>
        </div>

        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* STORAGE ROW */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Total Storage Used</p>

          {!hasLoaded && (
            <p className="text-sm text-muted-foreground">Loading...</p>
          )}

          {hasLoaded && storageUsed === null && (
            <p className="text-sm text-muted-foreground">
              No usage data available yet
            </p>
          )}

          {hasLoaded && storageUsed !== null && (
            <p className="font-medium">
              {(storageUsed / 1024 / 1024).toFixed(2)} MB
            </p>
          )}
        </div>

        {/* PROGRESS BAR */}
        {hasLoaded && storageUsed !== null && (
          <div className="w-full h-3 bg-muted rounded-md overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>
        )}

        {/* QUOTA LABEL */}
        {hasLoaded && storageUsed !== null && (
          <p className="text-xs text-muted-foreground text-right">
            {percent.toFixed(1)}% of {(quotaBytes / 1024 / 1024).toFixed(0)} MB Quota
          </p>
        )}
      </CardContent>
    </Card>
  );
}
