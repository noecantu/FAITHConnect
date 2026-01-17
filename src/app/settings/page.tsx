'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { MemberRolesDialog } from '@/components/member/MemberRolesDialog';
import * as React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useChurchId } from '@/hooks/useChurchId';
import { useUserRoles } from '@/hooks/useUserRoles';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const { user } = useAuth();
  const churchId = useChurchId();
  const { isAdmin } = useUserRoles(churchId);
  const { toast } = useToast();
  
  const [calendarView, setCalendarView] = React.useState('calendar');
  const [fiscalYear, setFiscalYear] = React.useState(new Date().getFullYear().toString());
  const [showMemberPhotos, setShowMemberPhotos] = React.useState(true);

  React.useEffect(() => {
    // Load from local storage first
    const savedView = localStorage.getItem("calendarView");
    if (savedView === 'calendar' || savedView === 'list') {
      setCalendarView(savedView);
    }
    const savedYear = localStorage.getItem("fiscalYear");
    if (savedYear) {
      setFiscalYear(savedYear);
    }
    const savedShowPhotos = localStorage.getItem("showMemberPhotos");
    if (savedShowPhotos !== null) {
      setShowMemberPhotos(savedShowPhotos === 'true');
    }

    // Then try to load from Firestore
    const fetchUserSettings = async () => {
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.settings?.calendarView) {
              setCalendarView(data.settings.calendarView);
              localStorage.setItem("calendarView", data.settings.calendarView);
            }
            if (data.settings?.fiscalYear) {
              setFiscalYear(data.settings.fiscalYear);
              localStorage.setItem("fiscalYear", data.settings.fiscalYear);
            }
            if (data.settings?.showMemberPhotos !== undefined) {
              setShowMemberPhotos(data.settings.showMemberPhotos);
              localStorage.setItem("showMemberPhotos", String(data.settings.showMemberPhotos));
            }
          }
        } catch (error) {
          console.error("Error fetching user settings:", error);
        }
      }
    };

    fetchUserSettings();
  }, [user]);

  const handleCalendarViewChange = async (value: string) => {
    if (value === 'calendar' || value === 'list') {
      setCalendarView(value);
      localStorage.setItem("calendarView", value);
      await saveSetting('calendarView', value);
    }
  };

  const handleFiscalYearChange = async (value: string) => {
    setFiscalYear(value);
    localStorage.setItem("fiscalYear", value);
    await saveSetting('fiscalYear', value);
  };
  
  const handleShowPhotosChange = async (checked: boolean) => {
    setShowMemberPhotos(checked);
    localStorage.setItem("showMemberPhotos", String(checked));
    await saveSetting('showMemberPhotos', checked);
  };

  const saveSetting = async (key: string, value: any) => {
    if (user) {
        try {
            const userDocRef = doc(db, 'users', user.uid);
            await updateDoc(userDocRef, {
                [`settings.${key}`]: value
            });
        } catch (error) {
            console.error(`Error saving ${key}:`, error);
            toast({
                title: "Error",
                description: "Failed to save settings.",
                variant: "destructive",
            });
        }
    }
  }

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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* 1. Calendar View */}
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

        {/* 2. Financial Year */}
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

        {/* 3. Member Photos */}
        <Card>
          <CardHeader>
            <CardTitle>Member Photos</CardTitle>
            <CardDescription>
              Show member profile photos on the dashboard cards.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center space-x-2">
             <Switch id="show-photos" checked={showMemberPhotos} onCheckedChange={handleShowPhotosChange} />
             <Label htmlFor="show-photos">Show Photos</Label>
          </CardContent>
        </Card>
        
        {isAdmin && (
          <>
            {/* 4. Member Roles (Admin Only) */}
            <Card>
              <CardHeader>
                <CardTitle>Member Roles</CardTitle>
                <CardDescription>
                  Manage member permissions and roles for your organization.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MemberRolesDialog>
                  <Button className="w-full sm:w-auto">Manage Roles</Button>
                </MemberRolesDialog>
              </CardContent>
            </Card>
          </>
        )}

      </div>
    </>
  );
}
