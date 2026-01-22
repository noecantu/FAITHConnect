'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Music, ListMusic } from 'lucide-react';

export default function MusicPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Music</h1>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Songs */}
        <Link href="/music/songs">
          <Card className="p-6 hover:bg-accent transition-colors cursor-pointer">
            <div className="flex items-center gap-3 mb-2">
              <Music className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-semibold">Songs</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Manage your song library, keys, arrangements, and metadata.
            </p>
          </Card>
        </Link>

        {/* Set Lists */}
        <Link href="/music/setlists">
          <Card className="p-6 hover:bg-accent transition-colors cursor-pointer">
            <div className="flex items-center gap-3 mb-2">
              <ListMusic className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-semibold">Set Lists</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Create, edit, and organize worship sets for any service.
            </p>
          </Card>
        </Link>

      </div>
    </div>
  );
}
