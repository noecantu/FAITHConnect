'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/app/components/ui/card';

interface Props {
  storageUsed: number | null;
  hasLoaded: boolean;
}

export default function StorageUsageCard({ storageUsed, hasLoaded }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Database Storage</CardTitle>
        <CardDescription>
          View usage and storage allocation for your organization.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
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
      </CardContent>
    </Card>
  );
}
