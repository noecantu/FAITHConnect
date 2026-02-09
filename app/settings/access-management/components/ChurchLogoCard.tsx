'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { useToast } from '@/app/hooks/use-toast';

import { db, storage } from '@/app/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

interface Props {
  churchId: string;
}

export default function ChurchLogoCard({ churchId }: Props) {
  const { toast } = useToast();

  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);

  // Load existing logo
  useEffect(() => {
    if (!churchId) return;

    const load = async () => {
      const snap = await getDoc(doc(db, 'churches', churchId));
      if (snap.exists()) {
        setLogoUrl(snap.data().logoUrl ?? null);
      }
    };

    load();
  }, [churchId]);

  // Upload handler
  const handleUpload = async (file: File) => {
    if (!churchId) return;

    setUploading(true);

    try {
      const storageRef = ref(storage, `churches/${churchId}/logo`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      setLogoUrl(url);
      toast({ title: 'Logo uploaded', description: 'Preview updated.' });
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err.message });
    } finally {
      setUploading(false);
    }
  };

  // Save handler
  const handleSave = async () => {
    if (!churchId) return;

    setSaving(true);

    try {
      await updateDoc(doc(db, 'churches', churchId), {
        logoUrl,
        updatedAt: new Date(),
      });

      toast({ title: 'Saved', description: 'Church logo updated.' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message });
    } finally {
      setSaving(false);
    }
  };

  // Remove logo handler
  const handleRemove = async () => {
    if (!churchId) return;

    setRemoving(true);

    try {
      const storageRef = ref(storage, `churches/${churchId}/logo`);
      await deleteObject(storageRef);

      setLogoUrl(null);

      await updateDoc(doc(db, 'churches', churchId), {
        logoUrl: null,
        updatedAt: new Date(),
      });

      toast({ title: 'Logo removed', description: 'The church logo has been deleted.' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message });
    } finally {
      setRemoving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Church Logo</CardTitle>
        <CardDescription>Upload and manage your church’s logo.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Preview */}
        {logoUrl ? (
          <img
            src={logoUrl}
            alt="Church Logo"
            className="h-20 w-20 rounded object-cover border"
          />
        ) : (
          <p className="text-sm text-muted-foreground italic">
            No logo uploaded yet.
          </p>
        )}

        {/* Upload */}
        <Input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleUpload(file);
          }}
        />

        <div className="flex gap-2">
          {/* Save */}
          <Button onClick={handleSave} disabled={saving || uploading}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>

          {/* Remove */}
          {logoUrl && (
            <Button
              variant="destructive"
              onClick={handleRemove}
              disabled={removing}
            >
              {removing ? 'Removing...' : 'Remove Logo'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
