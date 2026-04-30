"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/app/hooks/use-toast";
import { useAuth } from "@/app/hooks/useAuth";

import { PageHeader } from "@/app/components/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Button } from "@/app/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/app/components/ui/select";

type ChurchOption = {
  id: string;
  name: string;
};

type Props = {
  churches: ChurchOption[];
};

type AccountType = "ChurchUser" | "ChurchAdmin" | "RegionalAdmin" | "DistrictAdmin";

const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado",
  "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho",
  "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana",
  "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota",
  "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada",
  "New Hampshire", "New Jersey", "New Mexico", "New York",
  "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon",
  "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
  "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington",
  "West Virginia", "Wisconsin", "Wyoming",
];

const ACCOUNT_TYPES: Array<{ value: AccountType; label: string }> = [
  { value: "ChurchUser", label: "Church User" },
  { value: "ChurchAdmin", label: "Church Administrator" },
  { value: "RegionalAdmin", label: "Regional Administrator" },
  { value: "DistrictAdmin", label: "District Administrator" },
];

export default function CreateUserClient({ churches }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accountType, setAccountType] = useState<AccountType | "">("");
  const [churchId, setChurchId] = useState("");

  const [regionName, setRegionName] = useState("");
  const [state, setState] = useState("");
  const [title, setTitle] = useState("");

  const [districtName, setDistrictName] = useState("");
  const [districtTitle, setDistrictTitle] = useState("");
  const [districtState, setDistrictState] = useState("");

  const [loading, setLoading] = useState(false);

  const needsChurch = useMemo(
    () => accountType === "ChurchUser" || accountType === "ChurchAdmin",
    [accountType]
  );

  async function handleCreateUser() {
    try {
      setLoading(true);

      if (!accountType) {
        toast({ title: "Missing Account Type", description: "Please select an account type." });
        return;
      }

      if (needsChurch && !churchId) {
        toast({ title: "Church Required", description: "Please select a church." });
        return;
      }

      if (accountType === "RegionalAdmin") {
        if (!regionName.trim() || !state.trim() || !title.trim()) {
          toast({ title: "Missing Fields", description: "Regional Admin requires title, region, and state." });
          return;
        }
      }

      if (accountType === "DistrictAdmin") {
        if (!districtName.trim() || !districtTitle.trim() || !districtState.trim()) {
          toast({ title: "Missing Fields", description: "District Admin requires title, district, and state." });
          return;
        }
      }

      if (!currentUser) {
        toast({ title: "Not Authorized", description: "You must be logged in as Root Admin." });
        return;
      }

      const actorUid = currentUser.uid;
      const actorName =
        `${currentUser.firstName ?? ""} ${currentUser.lastName ?? ""}`.trim() || "Root Admin";

      if (accountType === "ChurchUser" || accountType === "ChurchAdmin") {
        const response = await fetch("/api/church-users/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName,
            lastName,
            email,
            password,
            churchId,
            roles: [accountType === "ChurchAdmin" ? "Admin" : "Member"],
            permissions: [],
          }),
        });

        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.error || "Failed to create church user.");
        }

        toast({
          title: "User Created",
          description:
            accountType === "ChurchAdmin"
              ? "Church Administrator account created successfully."
              : "Church User account created successfully.",
        });

        router.push(accountType === "ChurchAdmin" ? "/admin/church-admins" : "/admin/all-users");
        return;
      }

      const response = await fetch("/api/system-users/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          password,
          actorUid,
          actorName,
          roles: [accountType],
          regionName: accountType === "RegionalAdmin" ? regionName : null,
          state: accountType === "RegionalAdmin" ? state : null,
          title: accountType === "RegionalAdmin" ? title : null,
          districtName: accountType === "DistrictAdmin" ? districtName : null,
          districtTitle: accountType === "DistrictAdmin" ? districtTitle : null,
          districtState: accountType === "DistrictAdmin" ? districtState : null,
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to create admin user.");
      }

      toast({ title: "User Created", description: "Administrative user created successfully." });
      router.push("/admin/district-regional-admins");
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Could not create user.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Create User"
        subtitle="Create church, district, or regional users from one place."
      />

      <Card>
        <CardHeader>
          <CardTitle>User Information</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>First Name</Label>
            <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First Name" />
          </div>

          <div className="space-y-2">
            <Label>Last Name</Label>
            <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last Name" />
          </div>

          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com" />
          </div>

          <div className="space-y-2">
            <Label>Password</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimum 6 characters" />
          </div>

          <div className="space-y-2">
            <Label>Account Type</Label>
            <Select value={accountType} onValueChange={(value) => setAccountType(value as AccountType)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select account type" />
              </SelectTrigger>
              <SelectContent>
                {ACCOUNT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {needsChurch && (
            <div className="space-y-2">
              <Label>Church</Label>
              <Select value={churchId} onValueChange={setChurchId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select church" />
                </SelectTrigger>
                <SelectContent>
                  {churches.map((church) => (
                    <SelectItem key={church.id} value={church.id}>
                      {church.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {accountType === "RegionalAdmin" && (
            <>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Bishop" />
              </div>
              <div className="space-y-2">
                <Label>Region Name</Label>
                <Input value={regionName} onChange={(e) => setRegionName(e.target.value)} placeholder="e.g., South Central Region" />
              </div>
              <div className="space-y-2">
                <Label>State</Label>
                <Select value={state} onValueChange={setState}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a state" />
                  </SelectTrigger>
                  <SelectContent>
                    {US_STATES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {accountType === "DistrictAdmin" && (
            <>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={districtTitle} onChange={(e) => setDistrictTitle(e.target.value)} placeholder="e.g., Overseer" />
              </div>
              <div className="space-y-2">
                <Label>District Name</Label>
                <Input value={districtName} onChange={(e) => setDistrictName(e.target.value)} placeholder="e.g., North District" />
              </div>
              <div className="space-y-2">
                <Label>State</Label>
                <Select value={districtState} onValueChange={setDistrictState}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a state" />
                  </SelectTrigger>
                  <SelectContent>
                    {US_STATES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <Button onClick={handleCreateUser} disabled={loading} className="w-full">
            {loading ? "Creating..." : "Create User"}
          </Button>
        </CardContent>
      </Card>
    </>
  );
}
