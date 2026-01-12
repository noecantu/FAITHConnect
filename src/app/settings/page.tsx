'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MemberRolesDialog } from '@/components/MemberRolesDialog';
import * as React from 'react';

export default function SettingsPage() {
  const [calendarView, setCalendarView] = React.useState('calendar');
  const [fiscalYear, setFiscalYear] = React.useState(new Date().getFullYear().toString());

  React.useEffect(() => {
    const savedView = localStorage.getItem("calendarView");
    if (savedView === 'calendar' || savedView === 'list') {
      setCalendarView(savedView);
    }
    const savedYear = localStorage.getItem("fiscalYear");
    if (savedYear) {
      setFiscalYear(savedYear);
    }
  }, []);

  const handleCalendarViewChange = (value: string) => {
    if (value === 'calendar' || value === 'list') {
      setCalendarView(value);
      localStorage.setItem("calendarView", value);
    }
  };

  const handleFiscalYearChange = (value: string) => {
    setFiscalYear(value);
    localStorage.setItem("fiscalYear", value);
  };

  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear; i >= currentYear - 10; i--) {
      years.push(i.toString());
    }
    return years;
  };

  return (
    <>
      <PageHeader title="Settings" />
      <div className="grid gap-6">

        <Card>
          <CardHeader>
            <CardTitle>Financial Year</CardTitle>
            <CardDescription>
              Select the year for which to display financial totals.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={fiscalYear} onValueChange={handleFiscalYearChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select a year" />
              </SelectTrigger>
              <SelectContent>
                {generateYearOptions().map(year => (
                  <SelectItem key={year} value={year}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Calendar View</CardTitle>
            <CardDescription>
              Choose the default view for the Calendar of Events.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={calendarView}
              onValueChange={handleCalendarViewChange}
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
