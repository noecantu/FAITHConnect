'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { useToast } from '@/app/hooks/use-toast';

import { db } from '@/app/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

interface Props {
  churchId: string;
  onNameChange?: (name: string) => void; // for fallback initials
}

export default function ChurchProfileCard({ churchId, onNameChange }: Props) {
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [timezone, setTimezone] = useState('');
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);

  // Load church profile
  useEffect(() => {
    if (!churchId) return;

    const load = async () => {
      const snap = await getDoc(doc(db, 'churches', churchId));
      if (snap.exists()) {
        const data = snap.data();
        setName(data.name ?? '');
        setTimezone(data.timezone ?? '');
        setAddress(data.address ?? '');

        onNameChange?.(data.name ?? '');
      }
    };

    load();
  }, [churchId, onNameChange]);

  const handleSave = async () => {
    if (!churchId) return;

    setSaving(true);

    try {
      await updateDoc(doc(db, 'churches', churchId), {
        name,
        timezone,
        address,
        updatedAt: new Date(),
      });

      toast({ title: 'Saved', description: 'Church profile updated.' });
      onNameChange?.(name);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Church Profile</CardTitle>
        <CardDescription>Manage your church’s identity and details.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-1">
          <Label>Church Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="grid gap-1">
          <Label>Timezone</Label>
          <Input value={timezone} onChange={(e) => setTimezone(e.target.value)} />
        </div>

        <div className="grid gap-1">
          <Label>Address</Label>
          <Input value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>

        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </CardContent>
    </Card>
  );
}
