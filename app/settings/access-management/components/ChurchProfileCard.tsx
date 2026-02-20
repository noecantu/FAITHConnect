'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { useToast } from '@/app/hooks/use-toast';

import { db } from '@/app/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import TimezoneSelect from '@/app/components/settings/TimezoneSelect';
import { formatPhone } from '@/app/lib/formatters';

interface Props {
  churchId: string;
}

export default function ChurchProfileCard({ churchId }: Props) {
  const { toast } = useToast();
  const [name, setName] = useState(''); // display only, not editable
  const [timezone, setTimezone] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');       // raw digits
  const [phoneDisplay, setPhoneDisplay] = useState(''); // formatted
  const [originalTimezone, setOriginalTimezone] = useState('');
  const [originalAddress, setOriginalAddress] = useState('');
  const [originalPhone, setOriginalPhone] = useState('');

  const [saving, setSaving] = useState(false);


  // Load church profile
  useEffect(() => {
    if (!churchId) return;

    const load = async () => {
      const snap = await getDoc(doc(db, 'churches', churchId));
      if (!snap.exists()) return;

      const data = snap.data();

      // Identity
      setName(data.name ?? '');

      // Editable fields
      setTimezone(data.timezone ?? '');
      setAddress(data.address ?? '');
      setPhone(data.phone ?? '');
      setPhoneDisplay(formatPhone(data.phone ?? ''));

      // Originals
      setOriginalTimezone(data.timezone ?? '');
      setOriginalAddress(data.address ?? '');
      setOriginalPhone(data.phone ?? '');
    };

    load();
  }, [churchId]);

  // Detect unsaved changes
  const hasChanges =
    timezone !== originalTimezone ||
    address !== originalAddress ||
    phone !== originalPhone;

  // Phone input handler
  const handlePhoneChange = (value: string) => {
    const digits = value.replace(/\D/g, '');
    setPhone(digits);
    setPhoneDisplay(formatPhone(digits));
  };

  // Save handler
  const handleSave = async () => {
    if (!hasChanges || saving) return;

    setSaving(true);

    try {
      await updateDoc(doc(db, "churches", churchId), {
        timezone,
        address,
        phone,
        updatedAt: new Date(),
      });

      // Update originals
      setOriginalTimezone(timezone);
      setOriginalAddress(address);
      setOriginalPhone(phone);

      toast({
        title: "Saved",
        description: "Church profile updated.",
      });
    } catch (err: unknown) {
      let message = "Something went wrong.";

      if (err instanceof Error) {
        message = err.message;
      }

      toast({
        title: "Error",
        description: message,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{name || "Church Profile"}</CardTitle>
        <CardDescription>Manage your church’s identity and details.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">

        {/* Address */}
        <div className="grid gap-1">
          <Label>Address</Label>
          <Input value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>

        {/* Phone */}
        <div className="grid gap-1">
          <Label>Phone Number</Label>
          <Input
            value={phoneDisplay}
            onChange={(e) => handlePhoneChange(e.target.value)}
            placeholder="(555) 123‑4567"
          />
        </div>

        {/* Timezone */}
        <div className="grid gap-1">
          <TimezoneSelect value={timezone} onChange={setTimezone} />
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className="w-full sm:w-auto"
        >
          {saving ? "Saving..." : "Save Changes"}
        </Button>

      </CardContent>
    </Card>
  );
}
