'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MemberRolesDialog } from '@/components/member/MemberRolesDialog';
import { ReportDialog } from '@/components/report/ReportDialog';
import * as React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useChurchId } from '@/hooks/useChurchId';
import { useUserRoles } from '@/hooks/useUserRoles';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { listenToMembers } from '@/lib/members';
import { listenToContributions } from '@/lib/contributions';
import { generateMembersPDF, generateMembersExcel, generateContributionsPDF, generateContributionsExcel } from '@/lib/reports';
import type { Member, Contribution } from '@/lib/types';

export default function SettingsPage() {
  const [calendarView, setCalendarView] = React.useState('calendar');
  const [fiscalYear, setFiscalYear] = React.useState(new Date().getFullYear().toString());
  const { user } = useAuth();
  const churchId = useChurchId();
  const { isAdmin } = useUserRoles(churchId);
  const { toast } = useToast();

  const [members, setMembers] = React.useState<Member[]>([]);
  const [contributions, setContributions] = React.useState<Contribution[]>([]);
  const [reportType, setReportType] = React.useState<'members' | 'contributions' | null>(null);

  // Data Listeners for Reports
  React.useEffect(() => {
    if (isAdmin && churchId) {
      const unsubMembers = listenToMembers(churchId, setMembers);
      const unsubContributions = listenToContributions(churchId, setContributions);
      return () => {
        unsubMembers();
        unsubContributions();
      };
    }
  }, [isAdmin, churchId]);

  React.useEffect(() => {
    // Load from local storage first (for immediate feedback)
    const savedView = localStorage.getItem("calendarView");
    if (savedView === 'calendar' || savedView === 'list') {
      setCalendarView(savedView);
    }
    const savedYear = localStorage.getItem("fiscalYear");
    if (savedYear) {
      setFiscalYear(savedYear);
    }

    // Then try to load from Firestore if user is logged in
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

      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          await updateDoc(userDocRef, {
            'settings.calendarView': value
          });
        } catch (error) {
          console.error("Error saving calendar view:", error);
          toast({
            title: "Error",
            description: "Failed to save settings to your account.",
            variant: "destructive",
          });
        }
      }
    }
  };

  const handleFiscalYearChange = async (value: string) => {
    setFiscalYear(value);
    localStorage.setItem("fiscalYear", value);

    if (user) {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, {
          'settings.fiscalYear': value
        });
      } catch (error) {
        console.error("Error saving fiscal year:", error);
         toast({
            title: "Error",
            description: "Failed to save settings to your account.",
            variant: "destructive",
          });
      }
    }
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
        
        {isAdmin && (
          <>
            {/* 3. Member Roles (Admin Only) */}
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

            {/* 4. Reports (Admin Only) */}
            <Card>
              <CardHeader>
                <CardTitle>Reports</CardTitle>
                <CardDescription>
                  Export data to PDF or Excel format.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline" className="w-full sm:w-auto" onClick={() => setReportType('members')}>Export Members</Button>
                <Button variant="outline" className="w-full sm:w-auto" onClick={() => setReportType('contributions')}>Export Contributions</Button>
              </CardContent>
            </Card>
          </>
        )}

      </div>
      
      <ReportDialog
        open={!!reportType}
        onOpenChange={() => setReportType(null)}
        title={reportType === 'members' ? 'Members' : 'Contributions'}
        onPDF={() => {
            if (reportType === 'members') generateMembersPDF(members);
            if (reportType === 'contributions') generateContributionsPDF(contributions);
            setReportType(null);
        }}
        onExcel={() => {
            if (reportType === 'members') generateMembersExcel(members);
            if (reportType === 'contributions') generateContributionsExcel(contributions);
            setReportType(null);
        }}
      />
    </>
  );
}
