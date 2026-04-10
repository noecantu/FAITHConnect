'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { useToast } from '@/app/hooks/use-toast';
import { db } from '@/app/lib/firebase/client';
import { collection, doc, getDoc, getDocs, updateDoc } from 'firebase/firestore';
import TimezoneSelect from '@/app/components/settings/TimezoneSelect';
import { usePhoneInput } from '@/app/hooks/usePhoneInput';
import { Check } from "lucide-react";

interface Props {
  churchId: string;
}

export default function ChurchProfileCard({ churchId }: Props) {
  const { toast } = useToast();

  // Display-only name
  const [name, setName] = useState('');

  // Editable fields
  const [timezone, setTimezone] = useState('');
  const [address, setAddress] = useState('');

  // Phone (via hook)
  const phone = usePhoneInput();
  const [originalPhone, setOriginalPhone] = useState('');

  // Originals for change detection
  const [originalTimezone, setOriginalTimezone] = useState('');
  const [originalAddress, setOriginalAddress] = useState('');

  const [saving, setSaving] = useState(false);

  // Regional Settings
  const [regions, setRegions] = useState<any[]>([]);
  const [regionId, setRegionId] = useState("");
  const [originalRegionId, setOriginalRegionId] = useState("");

  // Load church profile
  useEffect(() => {
    if (!churchId) return;

    const load = async () => {
      const snap = await getDoc(doc(db, 'churches', churchId));
      if (!snap.exists()) return;

      const data = snap.data();

      // Load regions
      const regionSnap = await getDocs(collection(db, "regions"));
      const regionList = regionSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setRegions(regionList);

      // Set region from church data
      setRegionId(data.regionId ?? "");
      setOriginalRegionId(data.regionId ?? "");

      // Identity
      setName(data.name ?? '');

      // Editable fields
      setTimezone(data.timezone ?? '');
      setAddress(data.address ?? '');

      // Phone
      phone.setDigits(data.phone ?? '');
      setOriginalPhone(data.phone ?? '');

      // Originals
      setOriginalTimezone(data.timezone ?? '');
      setOriginalAddress(data.address ?? '');
    };

    load();
  }, [churchId]);

  // Detect unsaved changes
  const hasChanges =
    timezone !== originalTimezone ||
    address !== originalAddress ||
    phone.digits !== originalPhone ||
    regionId !== originalRegionId;

  // Save handler
  const handleSave = async () => {
    if (!hasChanges || saving) return;

    setSaving(true);

    try {
      await updateDoc(doc(db, "churches", churchId), {
        timezone,
        address,
        phone: phone.digits,
        regionId: regionId || null,
        updatedAt: new Date(),
      });

      // Update originals
      setOriginalTimezone(timezone);
      setOriginalAddress(address);
      setOriginalPhone(phone.digits);
      setOriginalRegionId(regionId);

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
    <Card className="relative bg-black/80 border-white/20 backdrop-blur-xl">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between w-full">
          <div>
            <CardTitle>{name || "Church Profile"}</CardTitle>
            <CardDescription>
              Manage your church’s identity and details.
            </CardDescription>
          </div>

          {/* Save Icon */}
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className={`
              p-2 rounded-md border
              bg-muted/20 transition
              focus:outline-none focus:ring-2 focus:ring-primary
              ${!hasChanges || saving 
                ? "opacity-40 cursor-not-allowed" 
                : "hover:bg-muted"}
            `}
          >
            {saving ? (
              <div className="h-5 w-5 animate-spin border-2 border-white/30 border-t-white rounded-full" />
            ) : (
              <Check className="h-5 w-5 text-white" />
            )}
          </button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Address + Phone */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="grid gap-2">
            <Label>Address</Label>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label>Phone Number</Label>
            <Input
              value={phone.display}
              onChange={(e) => phone.handleChange(e.target.value)}
              placeholder="(555) 123‑4567"
            />
          </div>
        </div>

        {/* Timezone + Region */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="grid gap-2">
            <Label>Timezone</Label>
            <TimezoneSelect value={timezone} onChange={setTimezone} />
          </div>

          <div className="grid gap-1">
            <Label>Region</Label>
            <select
              className="
                w-full rounded-md border border-input bg-background
                px-3 py-2 text-sm h-10
                focus:outline-none focus:ring-2 focus:ring-primary
              "
              value={regionId}
              onChange={(e) => setRegionId(e.target.value)}
            >
              <option value="">Select a Region</option>
              {regions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                  {r.regionAdminId ? ` — ${r.regionAdminId}` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
