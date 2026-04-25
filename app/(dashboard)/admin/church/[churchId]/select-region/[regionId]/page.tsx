//app/(dashboard)/admin/church/[church_id]/select-region/[region_id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
;
import { getSupabaseClient } from "@/app/lib/supabase/client";
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { useToast } from '@/app/hooks/use-toast';

export default function ConfirmRegionPage() {
  const supabase = getSupabaseClient();
  const { church_id, region_id } = useParams() as {
    church_id: string;
    region_id: string;
  };

  const router = useRouter();
  const { toast } = useToast();

  const [region, setRegion] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const snap = await supabase.from('regions').select('*').eq('id', region_id).single();
      if (snap.exists()) {
        setRegion({ id: snap.id, ...snap.data() });
      }
      setLoading(false);
    }
    load();
  }, [region_id]);

  async function handleConfirm() {
    if (!church_id || !region_id) return;

    setSaving(true);

    try {
      await updateDoc(doc(db, 'churches', church_id), {
        regionSelectedId: region_id,
        regionStatus: 'pending',
        region_id: null,
        updated_at: new Date(),
      });

      toast({
        title: 'Region Selected',
        description: 'Your region selection is pending approval.',
      });

      router.push(`/admin/church/${church_id}`);
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: 'Could not update church region.',
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 text-muted-foreground">
        Loading Region…
      </div>
    );
  }

  if (!region) {
    return (
      <div className="p-6 text-red-500">
        Region not found.
      </div>
    );
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

        {/* Title + Admin Name */}
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
          onClick={() => router.push(`/admin/church/${church_id}/select-region`)}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
