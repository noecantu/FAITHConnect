'use client';

import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";
import { Label } from "@/app/components/ui/label";
import { useUserCalendarSettings } from "@/app/hooks/useUserCalendarSettings";

export function CalendarPreferencesCard({ userId }: { userId: string }) {
  const { view, setView, loading } = useUserCalendarSettings(userId);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Calendar View</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-6 w-32 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calendar View</CardTitle>
      </CardHeader>

      <CardContent>
        <RadioGroup
          value={view}
          onValueChange={(v: "calendar" | "list") => setView(v)}
          className="flex items-center gap-6"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="calendar" id="calendar-view" />
            <Label htmlFor="calendar-view">Calendar</Label>
          </div>

          <div className="flex items-center gap-2">
            <RadioGroupItem value="list" id="list-view" />
            <Label htmlFor="list-view">List</Label>
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  );
}
