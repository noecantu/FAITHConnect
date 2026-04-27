//app/(dashboard)/admin/church/[churchId]/select-region/[regionId]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getSupabaseClient } from "@/app/lib/supabase/client";
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { useToast } from '@/app/hooks/use-toast';

export default function ConfirmRegionPage() {
  const supabase = getSupabaseClient();
  const { churchId, regionId } = useParams() as {
    churchId: string;
    regionId: string;
  };

  const router = useRouter();
  const { toast } = useToast();

  const [region, setRegion] = useState<Record<string, string | null> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('regions').select('*').eq('id', regionId).single();
      setRegion(data ?? null);
      setLoading(false);
    }
    load();
  }, [regionId]);

  async function handleConfirm() {
    if (!churchId || !regionId) return;

    setSaving(true);

    try {
      const { error } = await supabase
        .from('churches')
        .update({
          region_selected_id: regionId,
          region_status: 'pending',
          region_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', churchId);

      if (error) throw error;

      toast({
        title: 'Region Selected',
        description: 'Your region selection is pending approval.',
      });

      router.push(`/admin/church/${churchId}/settings`);
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: 'Could not update church region.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="p-6 text-muted-foreground">Loading Region…</div>;
  }

  if (!region) {
    return <div className="p-6 text-red-500">Region not found.</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Confirm Region</h1>
      <p className="text-muted-foreground">
        Please confirm that this is the correct region for your church.
      </p>

      <Card className="p-6 bg-black/60 border-white/20 backdrop-blur-xl space-y-3">
        {region.logo_url ? (
          <img
            src={region.logo_url}
            alt={`${region.name} logo`}
            className="h-16 w-16 rounded-md object-cover border border-white/20"
          />
        ) : null}

        <p className="text-xl font-semibold">{region.name}</p>

        {region.region_admin_title && region.region_admin_name && (
          <p className="text-sm text-muted-foreground">
            {region.region_admin_title}: {region.region_admin_name}
          </p>
        )}
      </Card>

      <div className="flex gap-4">
        <Button
          onClick={handleConfirm}
          disabled={saving}
          className="bg-primary text-white"
        >
          {saving ? 'Saving…' : 'Confirm Region'}
        </Button>

        <Button
          variant="outline"
          onClick={() => router.push(`/admin/church/${churchId}/select-region`)}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
