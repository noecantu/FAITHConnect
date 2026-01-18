'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MemberRolesDialog } from '@/components/member/MemberRolesDialog';
import * as React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useChurchId } from '@/hooks/useChurchId';
import { useUserRoles } from '@/hooks/useUserRoles';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const [calendarView, setCalendarView] = React.useState('calendar');
  const [fiscalYear, setFiscalYear] = React.useState(new Date().getFullYear().toString());
  const [cardView, setCardView] = React.useState('member-card');

  const { user } = useAuth();
  const churchId = useChurchId();
  const { isAdmin } = useUserRoles(churchId);
  const { toast } = useToast();

  // Load settings from localStorage + Firestore
  React.useEffect(() => {
    const savedView = localStorage.getItem("calendarView");
    if (savedView === 'calendar' || savedView === 'list') {
      setCalendarView(savedView);
    }

    const savedYear = localStorage.getItem("fiscalYear");
    if (savedYear) {
      setFiscalYear(savedYear);
    }

    const savedCardView = localStorage.getItem("cardView");
    if (savedCardView === 'show' || savedCardView === 'hide') {
      setCardView(savedCardView);
    }

    const fetchUserSettings = async () => {
      if (!user) return;

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

          if (data.settings?.cardView) {
            setCardView(data.settings.cardView);
            localStorage.setItem("cardView", data.settings.cardView);
          }
        }
      } catch (error) {
        console.error("Error fetching user settings:", error);
      }
    };

    fetchUserSettings();
  }, [user]);

  const handleCalendarViewChange = async (value: string) => {
    if (value !== 'calendar' && value !== 'list') return;

    setCalendarView(value);
    localStorage.setItem("calendarView", value);

    if (!user) return;

    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, { 'settings.calendarView': value });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings.",
        variant: "destructive",
      });
    }
  };

  const handleCardViewChange = async (value: string) => {
    if (value !== 'show' && value !== 'hide') return;

    setCardView(value);
    localStorage.setItem("cardView", value);

    if (!user) return;

    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, { 'settings.cardView': value });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings.",
        variant: "destructive",
      });
    }
  };

  const handleFiscalYearChange = async (value: string) => {
    setFiscalYear(value);
    localStorage.setItem("fiscalYear", value);

    if (!user) return;

    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, { 'settings.fiscalYear': value });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings.",
        variant: "destructive",
      });
    }
  };

  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 11 }, (_, i) => (currentYear - i).toString());
  };

  return (
    <>
      <PageHeader title="Settings" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Calendar View */}
        <Card>
          <CardHeader>
            <CardTitle>Calendar View</CardTitle>
            <CardDescription>Choose the default view for the Calendar of Events.</CardDescription>
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

        {/* Financial Year */}
        <Card>
          <CardHeader>
            <CardTitle>Financial Year</CardTitle>
            <CardDescription>Select the year for which to display financial totals.</CardDescription>
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

        {/* Member Dashboard View */}
        <Card>
          <CardHeader>
            <CardTitle>Member Card View</CardTitle>
            <CardDescription>Choose the default view for the Member Dashboard Cards.</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={cardView}
              onValueChange={handleCardViewChange}
              className="flex items-center space-x-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="show" id="show-view" />
                <Label htmlFor="show-view">Show Photo</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="hide" id="hide-view" />
                <Label htmlFor="hide-view">Hide Photo</Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle>Members</CardTitle>
              <CardDescription>Manage member settings and roles for your organization.</CardDescription>
            </CardHeader>
            <CardContent>
              <MemberRolesDialog>
                <Button className="w-full sm:w-auto">Manage Roles</Button>
              </MemberRolesDialog>
            </CardContent>
          </Card>
        )}

      </div>
    </>
  );
}
