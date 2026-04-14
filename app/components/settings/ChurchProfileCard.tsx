//app/components/settings/ChurchProfileCard.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { useToast } from '@/app/hooks/use-toast';
import { db } from '@/app/lib/firebase/client';
import { collection, doc, getDoc, getDocs, updateDoc } from 'firebase/firestore';
import TimezoneSelect from '@/app/components/settings/TimezoneSelect';
import { usePhoneInput } from '@/app/hooks/usePhoneInput';
import { Check } from "lucide-react";
import Link from 'next/link';

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
  const [regionSelectedId, setRegionSelectedId] = useState("");
  
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
      setRegionSelectedId(data.regionSelectedId ?? "");

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
    phone.digits !== originalPhone;

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

  // Helper: Get region object
  const selectedRegion = regions.find(
    (r) => r.id === regionId || r.id === regionSelectedId
  );

  return (
    <Card className="relative bg-black/80 border-white/20 backdrop-blur-xl rounded-xl shadow-lg">
      <CardHeader className="pb-2 border-b border-white/10">
        <div className="flex items-start justify-between w-full">
          <div>
            <CardTitle className="text-xl font-semibold tracking-tight">
              {name || "Church Profile"}
            </CardTitle>
            <CardDescription className="text-sm opacity-80">
              Manage your church’s identity and details.
            </CardDescription>
          </div>

          {/* Save Icon */}
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className={`
              p-2 rounded-md border border-white/20
              bg-white/5 transition
              focus:outline-none focus:ring-2 focus:ring-primary
              ${!hasChanges || saving 
                ? "opacity-40 cursor-not-allowed" 
                : "hover:bg-white/10"}
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

      <CardContent className="space-y-8 pt-6">
        {/* Address + Phone */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="grid gap-2">
            <Label className="text-sm font-medium">Address</Label>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="bg-black/40 border-white/20"
            />
          </div>

          <div className="grid gap-2">
            <Label className="text-sm font-medium">Phone Number</Label>
            <Input
              value={phone.display}
              onChange={(e) => phone.handleChange(e.target.value)}
              placeholder="(555) 123‑4567"
              className="bg-black/40 border-white/20"
            />
          </div>
        </div>

        <div className="border-t border-white/10" />

        {/* Timezone + Region */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-start">
          <div className="grid gap-2">
            <Label className="text-sm font-medium">Timezone</Label>
            <TimezoneSelect
              value={timezone}
              onChange={setTimezone}
            />
          </div>

          {/* REGION SELECTOR */}
          <div className="grid gap-2">

          {/* Label + Status pill on same row */}
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Region</Label>
          </div>

          {/* Region selector */}
          <Link
            href={`/admin/church/${churchId}/select-region`}
            className="
              w-full px-3 py-2 rounded-md border border-white/20
              bg-black/40 hover:bg-black/60 transition text-sm
              flex items-center justify-between
            "
          >
            <span className="truncate">
              {selectedRegion ? selectedRegion.name : "Select a Region"}
            </span>
            <span className="text-primary text-xs">Change →</span>
          </Link>

          {/* Leader */}
          {selectedRegion?.regionAdminTitle && selectedRegion?.regionAdminName && (
            <p className="text-sm text-green-400/80 text-center">
              Leader: {selectedRegion.regionAdminTitle} {selectedRegion.regionAdminName}
            </p>
          )}
        </div>
        </div>
      </CardContent>
    </Card>
  );
}