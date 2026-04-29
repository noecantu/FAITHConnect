"use client";

import { useState } from "react";
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
  "West Virginia", "Wisconsin", "Wyoming"
];

const ACCOUNT_TYPES = [
  { value: "RootAdmin", label: "Root Administrator" },
  { value: "SystemAdmin", label: "System Administrator" },
  { value: "Support", label: "Support Staff" },
  { value: "Auditor", label: "Auditor (Read-Only)" },
];

export default function CreateSystemUserClient() {
  const router = useRouter();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accountType, setAccountType] = useState("");

  // Regional Admin fields
  const [regionName, setRegionName] = useState("");
  const [state, setState] = useState("");
  const [title, setTitle] = useState("");

  // District Admin fields
  const [districtName, setDistrictName] = useState("");
  const [districtTitle, setDistrictTitle] = useState("");
  const [districtState, setDistrictState] = useState("");

  const [loading, setLoading] = useState(false);

  async function handleCreateUser() {
    try {
      setLoading(true);

      if (!accountType) {
        toast({
          title: "Missing Account Type",
          description: "Please select an account type for this platform admin user.",
        });
        return;
      }

      // Regional Admin validation
      if (accountType === "RegionalAdmin") {
        if (!regionName.trim()) {
          toast({
            title: "Region Required",
            description: "Please enter a region name.",
          });
          return;
        }
        if (!state.trim()) {
          toast({
            title: "State Required",
            description: "Please select a state.",
          });
          return;
        }
        if (!title.trim()) {
          toast({
            title: "Title Required",
            description: "Please enter a title for this Regional Admin.",
          });
          return;
        }
      }

      // District Admin validation
      if (accountType === "DistrictAdmin") {
        if (!districtName.trim()) {
          toast({
            title: "District Required",
            description: "Please enter a district name.",
          });
          return;
        }
        if (!districtTitle.trim()) {
          toast({
            title: "Title Required",
            description: "Please enter a title for this District Admin.",
          });
          return;
        }
        if (!districtState.trim()) {
          toast({
            title: "State Required",
            description: "Please select a state.",
          });
          return;
        }
      }

      if (!currentUser) {
        toast({
          title: "Not Authorized",
          description: "You must be logged in as a system admin.",
        });
        return;
      }

      const actorUid = currentUser.uid;
      const actorName =
        `${currentUser.firstName ?? ""} ${currentUser.lastName ?? ""}`.trim() ||
        "System Admin";

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

      if (result.success) {
        toast({
          title: "Platform Admin User Created",
          description: "The new platform admin user has been added.",
        });

        router.push("/admin/users");
      } else {
        toast({
          title: "Error Creating User",
          description: result.error || "An unexpected error occurred.",
        });
      }

    } catch (err: unknown) {
      console.error("Failed to create system user:", err);

      const message =
        err instanceof Error ? err.message : "Could not create system user.";

      toast({
        title: "Error",
        description: message,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Create Platform Admin User"
        subtitle="Add a new non-church administrative account."
      />

      <Card>
        <CardHeader>
          <CardTitle>User Information</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* First Name */}
          <div className="space-y-2">
            <Label>First Name</Label>
            <Input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First Name"
            />
          </div>

          {/* Last Name */}
          <div className="space-y-2">
            <Label>Last Name</Label>
            <Input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Last Name"
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label>Password</Label>
            <Input
              type="password"
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* Account Type */}
          <div className="space-y-2">
            <Label>Account Type</Label>
            <Select value={accountType} onValueChange={setAccountType}>
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

          {/* Regional Admin Fields */}
          {accountType === "RegionalAdmin" && (
            <>
              {/* Title */}
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  placeholder="e.g., Bishop, Apostle, President"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              {/* Region Name */}
              <div className="space-y-2">
                <Label>Region Name</Label>
                <Input
                  placeholder="e.g., South Central District"
                  value={regionName}
                  onChange={(e) => setRegionName(e.target.value)}
                />
              </div>

              {/* State */}
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

          {/* District Admin Fields */}
          {accountType === "DistrictAdmin" && (
            <>
              {/* Title */}
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  placeholder="e.g., Bishop, Apostle, President"
                  value={districtTitle}
                  onChange={(e) => setDistrictTitle(e.target.value)}
                />
              </div>

              {/* District Name */}
              <div className="space-y-2">
                <Label>District Name</Label>
                <Input
                  placeholder="e.g., Central District"
                  value={districtName}
                  onChange={(e) => setDistrictName(e.target.value)}
                />
              </div>

              {/* State */}
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

          {/* Save Button */}
          <Button
            className="w-full mt-4"
            onClick={handleCreateUser}
            disabled={loading}
          >
            {loading ? "Creating..." : "Create System User"}
          </Button>
        </CardContent>
      </Card>
    </>
  );
}