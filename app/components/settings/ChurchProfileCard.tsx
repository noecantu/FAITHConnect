'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { useToast } from '@/app/hooks/use-toast';
import { getSupabaseClient } from "@/app/lib/supabase/client";
import TimezoneSelect from '@/app/components/settings/TimezoneSelect';
import { usePhoneInput } from '@/app/hooks/usePhoneInput';
import { Check } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';

interface Props {
  church_id: string;
}

export default function ChurchProfileCard({
  church_id,
}: Props) {
  const supabase = getSupabaseClient();
  const { toast } = useToast();

  // Display-only name
  const [name, setName] = useState('');

  // Editable fields
  const [timezone, setTimezone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [addressState, setAddressState] = useState('');
  const [zip, setZip] = useState('');
  const [country, setCountry] = useState('');
  const [email, setEmail] = useState('');

  // NEW: Leader fields
  const [leaderName, setLeaderName] = useState('');
  const [leaderTitle, setLeaderTitle] = useState('');

  // Phone (via hook)
  const phone = usePhoneInput();
  const [originalPhone, setOriginalPhone] = useState('');

  // Originals for change detection
  const [originalTimezone, setOriginalTimezone] = useState('');
  const [originalAddress, setOriginalAddress] = useState('');
  const [originalCity, setOriginalCity] = useState('');
  const [originalAddressState, setOriginalAddressState] = useState('');
  const [originalZip, setOriginalZip] = useState('');
  const [originalCountry, setOriginalCountry] = useState('');
  const [originalEmail, setOriginalEmail] = useState('');
  const [originalLeaderName, setOriginalLeaderName] = useState('');
  const [originalLeaderTitle, setOriginalLeaderTitle] = useState('');

  const [saving, setSaving] = useState(false);

  const [region_id, setRegionId] = useState("");

  useEffect(() => {
    if (!church_id) return;

    const load = async () => {
      const { data, error } = await supabase.from('churches').select('*').eq('id', church_id).maybeSingle();
      if (error) { console.error('ChurchProfileCard load error:', error); return; }
      if (!data) return;

      // Set region from church data
      setRegionId(data.region_id ?? "");

      // Identity
      setName(data.name ?? '');

      // Editable fields
      setTimezone(data.timezone ?? '');
      setAddress(data.address ?? '');
      setCity(data.city ?? '');
      setAddressState(data.state ?? '');
      setZip(data.zip ?? '');
      setCountry(data.country ?? '');
      setEmail(data.email ?? '');

      // Leader fields
      setLeaderName(data.leader_name ?? '');
      setLeaderTitle(data.leader_title ?? '');

      // Phone
      phone.setDigits(data.phone ?? '');
      setOriginalPhone(data.phone ?? '');

      // Originals
      setOriginalTimezone(data.timezone ?? '');
      setOriginalAddress(data.address ?? '');
      setOriginalCity(data.city ?? '');
      setOriginalAddressState(data.state ?? '');
      setOriginalZip(data.zip ?? '');
      setOriginalCountry(data.country ?? '');
      setOriginalEmail(data.email ?? '');
      setOriginalLeaderName(data.leader_name ?? '');
      setOriginalLeaderTitle(data.leader_title ?? '');
    };

    load();
  }, [church_id]);

  // Detect unsaved changes
  const hasChanges =
    timezone !== originalTimezone ||
    address !== originalAddress ||
    city !== originalCity ||
    addressState !== originalAddressState ||
    zip !== originalZip ||
    country !== originalCountry ||
    email !== originalEmail ||
    phone.digits !== originalPhone ||
    leaderName !== originalLeaderName ||
    leaderTitle !== originalLeaderTitle;

  // Save handler
  const handleSave = async () => {
    if (!hasChanges || saving) return;

    setSaving(true);

    try {
      const res = await fetch(`/api/church/${encodeURIComponent(church_id)}/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timezone,
          address,
          city,
          state: addressState,
          zip,
          country,
          email,
          phone: phone.digits,
          leader_name: leaderName,
          leader_title: leaderTitle,
          region_id: region_id || null,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(typeof body.error === 'string' ? body.error : `HTTP ${res.status}`);
      }

      // Update originals
      setOriginalTimezone(timezone);
      setOriginalAddress(address);
      setOriginalCity(city);
      setOriginalAddressState(addressState);
      setOriginalZip(zip);
      setOriginalCountry(country);
      setOriginalEmail(email);
      setOriginalPhone(phone.digits);
      setOriginalLeaderName(leaderName);
      setOriginalLeaderTitle(leaderTitle);

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
                {/* Leader Name + Title */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="grid gap-2">
            <Label className="text-sm font-medium">Church Leader Name</Label>
            <Input
              value={leaderName}
              onChange={(e) => setLeaderName(e.target.value)}
              className="bg-black/40 border-white/20"
            />
          </div>

          <div className="grid gap-2">
            <Label className="text-sm font-medium">Church Leader Title</Label>
            <Input
              value={leaderTitle}
              onChange={(e) => setLeaderTitle(e.target.value)}
              className="bg-black/40 border-white/20"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="grid gap-2">
            <Label className="text-sm font-medium">Street Address</Label>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Main St"
              className="bg-black/40 border-white/20"
            />
          </div>

          <div className="grid gap-2">
            <Label className="text-sm font-medium">City</Label>
            <Input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Springfield"
              className="bg-black/40 border-white/20"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">

          <div className="grid gap-2">
            <Label className="text-sm font-medium">State</Label>
            <Input
              value={addressState}
              onChange={(e) => setAddressState(e.target.value)}
              placeholder="TX"
              className="bg-black/40 border-white/20"
            />
          </div>

          <div className="grid gap-2">
            <Label className="text-sm font-medium">ZIP</Label>
            <Input
              value={zip}
              onChange={(e) => setZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
              placeholder="75001"
              inputMode="numeric"
              maxLength={5}
              className="bg-black/40 border-white/20"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="grid gap-2">
            <Label className="text-sm font-medium">Country</Label>
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger className="bg-black/40 border-white/20">
                <SelectValue placeholder="Select a country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="United States">United States</SelectItem>
                <SelectItem value="Canada">Canada</SelectItem>
                <SelectItem value="Mexico">Mexico</SelectItem>
                <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                <SelectItem value="Australia">Australia</SelectItem>
                <SelectItem value="New Zealand">New Zealand</SelectItem>
                <SelectItem value="South Africa">South Africa</SelectItem>
                <SelectItem value="Nigeria">Nigeria</SelectItem>
                <SelectItem value="Kenya">Kenya</SelectItem>
                <SelectItem value="Ghana">Ghana</SelectItem>
                <SelectItem value="Brazil">Brazil</SelectItem>
                <SelectItem value="Colombia">Colombia</SelectItem>
                <SelectItem value="Argentina">Argentina</SelectItem>
                <SelectItem value="Chile">Chile</SelectItem>
                <SelectItem value="Peru">Peru</SelectItem>
                <SelectItem value="Philippines">Philippines</SelectItem>
                <SelectItem value="India">India</SelectItem>
                <SelectItem value="South Korea">South Korea</SelectItem>
                <SelectItem value="Germany">Germany</SelectItem>
                <SelectItem value="France">France</SelectItem>
                <SelectItem value="Spain">Spain</SelectItem>
                <SelectItem value="Italy">Italy</SelectItem>
                <SelectItem value="Netherlands">Netherlands</SelectItem>
                <SelectItem value="Sweden">Sweden</SelectItem>
                <SelectItem value="Norway">Norway</SelectItem>
                <SelectItem value="Denmark">Denmark</SelectItem>
                <SelectItem value="Finland">Finland</SelectItem>
                <SelectItem value="Switzerland">Switzerland</SelectItem>
                <SelectItem value="Portugal">Portugal</SelectItem>
                <SelectItem value="Ireland">Ireland</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label className="text-sm font-medium">Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="info@mychurch.org"
              className="bg-black/40 border-white/20"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="grid gap-2">
            <Label className="text-sm font-medium">Phone Number</Label>
            <Input
              value={phone.display}
              onChange={(e) => phone.handleChange(e.target.value)}
              placeholder="(555) 123‑4567"
              className="bg-black/40 border-white/20"
            />
          </div>

          <div className="grid gap-2">
            <Label className="text-sm font-medium">Timezone</Label>
            <TimezoneSelect
              value={timezone}
              onChange={setTimezone}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}