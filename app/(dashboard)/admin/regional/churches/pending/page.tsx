//app/(dashboard)/admin/regional/churches/pending/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { db } from '@/app/lib/firebase/client';
import { usePermissions } from '@/app/hooks/usePermissions';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { useToast } from '@/app/hooks/use-toast';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';

export default function PendingChurchesPage() {
  const { regionId, isRegionalAdmin, user, loading: permLoading } = usePermissions();
  const { toast } = useToast();

  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!regionId) return;

    const q = query(
      collection(db, 'churches'),
      where('regionSelectedId', '==', regionId),
      where('regionStatus', '==', 'pending')
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setPending(list);
        setLoading(false);
      },
      (error) => {
        if ((error as { code?: string }).code !== 'permission-denied') console.error('pending churches snapshot error:', error);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [regionId]);

  async function handleApprove(churchId: string) {
    const res = await fetch("/api/church-approval/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ churchId }),
      credentials: "include",
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast({
        title: "Error",
        description: data.error ?? "Could not approve church.",
      });
      return;
    }

    toast({
      title: "Church Approved",
      description: "This church is now officially part of your region.",
    });
  }

  async function handleReject(churchId: string) {
    await updateDoc(doc(db, 'churches', churchId), {
      regionStatus: 'rejected',
      updatedAt: new Date(),
    });

    toast({
      title: 'Church Rejected',
      description: 'The church has been marked as rejected.',
    });
  }

  if (permLoading) {
    return (
      <div className="p-6 text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!isRegionalAdmin) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Unauthorized</h1>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 text-muted-foreground">
        Loading Pending Churches…
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Pending Church Approvals</h1>
      <p className="text-muted-foreground">
        These churches have selected your region and are awaiting your approval.
      </p>

      {pending.length === 0 && (
        <p className="text-muted-foreground">No pending churches.</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pending.map((church) => (
          <Card
            key={church.id}
            className="p-4 bg-black/60 border-white/20 backdrop-blur-xl space-y-3"
          >
            <p className="text-lg font-semibold">{church.name}</p>

            <div className="flex gap-3">
              <Button
                className="bg-green-600 text-white"
                onClick={() => handleApprove(church.id)}
              >
                Approve
              </Button>

              <Button
                className="bg-red-600 text-white"
                onClick={() => handleReject(church.id)}
              >
                Reject
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
