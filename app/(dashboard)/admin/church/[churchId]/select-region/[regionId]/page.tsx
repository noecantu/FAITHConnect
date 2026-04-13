'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/app/lib/firebase/client';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { useToast } from '@/app/hooks/use-toast';

export default function ConfirmRegionPage() {
  const { churchId, regionId } = useParams() as {
    churchId: string;
    regionId: string;
  };

  const router = useRouter();
  const { toast } = useToast();

  const [region, setRegion] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const snap = await getDoc(doc(db, 'regions', regionId));
      if (snap.exists()) {
        setRegion({ id: snap.id, ...snap.data() });
      }
      setLoading(false);
    }
    load();
  }, [regionId]);

  async function handleConfirm() {
    if (!churchId || !regionId) return;

    setSaving(true);

    try {
      await updateDoc(doc(db, 'churches', churchId), {
        regionId,
        regionStatus: 'pending',
        updatedAt: new Date(),
      });

      toast({
        title: 'Region Selected',
        description: 'Your region selection is pending approval.',
      });

      router.push(`/admin/church/${churchId}`);
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
        Loading region…
      </div>
    );
  }

  if (!region) {
    return (
      <div className="p-6 text-red-400">
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
        <p className="text-xl font-semibold">{region.name}</p>

        {/* Title + Admin Name */}
        {region.regionAdminTitle && region.regionAdminName && (
          <p className="text-sm text-muted-foreground">
            {region.regionAdminTitle}: {region.regionAdminName}
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
