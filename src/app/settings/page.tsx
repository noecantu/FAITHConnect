'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" />
      <div className="grid gap-6">

        {/* Profile */}
        <Card>…</Card>

        {/* Appearance */}
        <Card>…</Card>

        {/* Notifications */}
        <Card>…</Card>

        {/* Calendar of Events */}
        <Card>
          <CardHeader>
            <CardTitle>Calendar of Events View</CardTitle>
          </CardHeader>

          <CardContent>
            <RadioGroup
              defaultValue="calendar"
              onValueChange={(value) => {
                console.log("Selected:", value);
              }}
              className="flex items-center space-x-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="calendar" id="calendar-view" />
                <Label htmlFor="calendar-view">Calendar View</Label>
              </div>

              <div className="flex items-center space-x-2">
                <RadioGroupItem value="list" id="list-view" />
                <Label htmlFor="list-view">List View</Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>
      </div>
    </>
  );
}