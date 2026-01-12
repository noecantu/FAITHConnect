'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from '@/components/ui/button';
import { MemberRolesDialog } from '@/components/MemberRolesDialog';
import * as React from 'react';

export default function SettingsPage() {
  const [calendarView, setCalendarView] = React.useState('calendar');

  React.useEffect(() => {
    const savedView = localStorage.getItem("calendarView");
    if (savedView === 'calendar' || savedView === 'list') {
      setCalendarView(savedView);
    }
  }, []);

  const handleValueChange = (value: string) => {
    if (value === 'calendar' || value === 'list') {
      setCalendarView(value);
      localStorage.setItem("calendarView", value);
    }
  };

  return (
    <>
      <PageHeader title="Settings" />
      <div className="grid gap-6">
        
        {/* Calendar of Events */}
        <Card>
          <CardHeader>
            <CardTitle>Calendar of Events View</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={calendarView}
              onValueChange={handleValueChange}
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

        {/* Role Assignment */}
        <Card>
          <CardHeader>
            <CardTitle>Member Roles</CardTitle>
            <CardDescription>
              Manage member permissions and roles for your organization.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MemberRolesDialog>
              <Button>Manage Roles</Button>
            </MemberRolesDialog>
          </CardContent>
        </Card>

      </div>
    </>
  );
}
