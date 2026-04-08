'use client';

import { PageHeader } from '@/app/components/page-header';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/app/components/ui/card';
import { ContributionChart } from '@/app/components/contributions/ContributionChart';
import { ContributionsTable } from '@/app/components/contributions/ContributionsTable';
import { getColumns } from '@/app/components/contributions/Columns';
import { EditContributionDialog } from '@/app/components/contributions/EditContributionDialog';
import { AddContributionDialog } from '@/app/components/contributions/AddContributionDialog';
import { getContributionSummaryText } from "@/app/components/contributions/ContributionSummary";
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { useChurchId } from '@/app/hooks/useChurchId';
import { listenToContributions } from '@/app/lib/contributions';
import { listenToMembers } from '@/app/lib/members';
import { useUserRoles } from '@/app/hooks/useUserRoles';
import type { Contribution, Member } from '@/app/lib/types';
import { useEffect, useMemo, useState } from 'react';
import { Fab } from '@/app/components/ui/fab';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/app/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/app/components/ui/radio-group';
import { useContributionHistorySettings } from "@/app/hooks/useContributionHistorySettings";
import { useAuth } from "@/app/hooks/useAuth";
import { DashboardPage } from '../layout/DashboardPage';

// ------------------------------
// Page Component
// ------------------------------
export default function ContributionsPage() {
  // ------------------------------
  // Base state
  // ------------------------------
  const [isClient, setIsClient] = useState(false);
  const { churchId } = useChurchId();

  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selected, setSelected] = useState<Contribution | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { canManageContributions, canReadContributions } = useUserRoles();
  const canEdit = canManageContributions;
  const canView = canReadContributions;

  // ------------------------------
  // Effects (must be above conditional return)
  // ------------------------------
  useEffect(() => setIsClient(true), []);

  useEffect(() => {
    if (!churchId) return;
    return listenToContributions(churchId, setContributions);
  }, [churchId]);

  useEffect(() => {
    if (!churchId) return;
    return listenToMembers(churchId, setMembers);
  }, [churchId]);

  // ------------------------------
  // Columns
  // ------------------------------
  const columns = useMemo(() => getColumns(), []);
  const { user } = useAuth();

  const {
    breakdown: timeFrame,
    year: selectedYear,
    month: selectedMonth,
    week: selectedWeek,

    setBreakdownPersisted,
    setYearPersisted,
    setMonthPersisted,
    setWeekPersisted,
  } = useContributionHistorySettings(user);

  // ------------------------------
  // Available Years
  // ------------------------------
  const availableYears = useMemo(() => {
    return Array.from(
      new Set(contributions.map(c => new Date(c.date).getFullYear()))
    ).sort((a, b) => b - a);
  }, [contributions]);

  // ------------------------------
  // Available Months (for selected year)
  // ------------------------------
  const availableMonths = useMemo(() => {
    if (!selectedYear) return [];

    return Array.from(
      new Set(
        contributions
          .filter(c => new Date(c.date).getFullYear() === Number(selectedYear))
          .map(c => new Date(c.date).getMonth() + 1)
      )
    ).sort((a, b) => a - b);
  }, [contributions, selectedYear]);

  // ------------------------------
  // Available Weeks (for selected year)
  // ------------------------------
  const availableWeeks = useMemo(() => {
    if (!selectedYear) return [];

    const getWeek = (date: Date) => {
      const firstDay = new Date(date.getFullYear(), 0, 1);
      const diff = (date.getTime() - firstDay.getTime()) / 86400000;
      return Math.ceil((diff + firstDay.getDay() + 1) / 7);
    };

    return Array.from(
      new Set(
        contributions
          .filter(c => new Date(c.date).getFullYear() === Number(selectedYear))
          .map(c => getWeek(new Date(c.date)))
      )
    ).sort((a, b) => a - b);
  }, [contributions, selectedYear]);

  // ------------------------------
  // Filtered Contributions
  // ------------------------------
  const filteredContributions = useMemo(() => {
    let list = [...contributions];

    if (selectedYear) {
      list = list.filter(c =>
        new Date(c.date).getFullYear() === Number(selectedYear)
      );
    }

    if (timeFrame === "month" && selectedMonth) {
      list = list.filter(c =>
        new Date(c.date).getMonth() + 1 === Number(selectedMonth)
      );
    }

    if (timeFrame === "week" && selectedWeek) {
      const getWeek = (date: Date) => {
        const firstDay = new Date(date.getFullYear(), 0, 1);
        const diff = (date.getTime() - firstDay.getTime()) / 86400000;
        return Math.ceil((diff + firstDay.getDay() + 1) / 7);
      };
      list = list.filter(c => getWeek(new Date(c.date)) === selectedWeek);
    }

    return list;
  }, [contributions, timeFrame, selectedYear, selectedMonth, selectedWeek]);

  // ------------------------------
  // Summary Text
  // ------------------------------
  const summaryText = getContributionSummaryText(
    filteredContributions,
    timeFrame,
    selectedYear,
    selectedMonth,
    selectedWeek
  );

  // ------------------------------
  // Row click handler
  // ------------------------------
  function handleRowClick(contribution: Contribution) {
    setSelected(contribution);
    setIsDialogOpen(true);
  }

  // ------------------------------
  // Theme
  // ------------------------------
  const darkTheme = createTheme({
    palette: { mode: 'dark' },
  });

  // ------------------------------
  // Conditional return (AFTER all hooks)
  // ------------------------------
  if (!isClient) return null;

  if (!canView) {
    return (
      <DashboardPage>
        <ThemeProvider theme={darkTheme}>
          <PageHeader
            title="Contributions"
            subtitle={summaryText}
            className="mb-2"
          />
          {/* You can add a small message here if you want */}
        </ThemeProvider>
      </DashboardPage>
    );
  }
  return (
    <DashboardPage>
      <ThemeProvider theme={darkTheme}>
        <PageHeader
          title="Contributions"
          subtitle={summaryText}
          className="mb-2"
        >
          <div className="flex flex-col gap-4">

            {/* Breakdown Controls */}
            <div className="flex flex-wrap justify-end items-center gap-4 mt-2 w-full">
              <span className="text-sm font-medium text-muted-foreground">
                Breakdown:
              </span>

              <RadioGroup
                value={timeFrame}
                onValueChange={(v) => setBreakdownPersisted(v as "year" | "month" | "week")}
                className="flex items-center gap-4"
              >
                <div className="flex items-center gap-1">
                  <RadioGroupItem value="year" id="tf-year" />
                  <label htmlFor="tf-year" className="text-sm text-muted-foreground">Year</label>
                </div>

                <div className="flex items-center gap-1">
                  <RadioGroupItem value="month" id="tf-month" />
                  <label htmlFor="tf-month" className="text-sm text-muted-foreground">Month</label>
                </div>

                <div className="flex items-center gap-1">
                  <RadioGroupItem value="week" id="tf-week" />
                  <label htmlFor="tf-week" className="text-sm text-muted-foreground">Week</label>
                </div>
              </RadioGroup>
            </div>

            {/* Dynamic Dropdowns */}
            <div className="flex flex-row justify-end items-center gap-4 w-full">

              {/* Year */}
              <Select
                value={selectedYear ? String(selectedYear) : ""}
                onValueChange={(v) => setYearPersisted(Number(v))}
              >
                <SelectTrigger
                  className="
                    h-9
                    flex-1 min-[360px]:flex-none min-[360px]:w-1/2 sm:w-[140px]
                    bg-black/80 border border-white/20 backdrop-blur-xl
                    text-white/80
                    hover:bg-white/5 hover:border-white/20
                    transition
                  "
                >
                  <SelectValue placeholder="Year" />
                </SelectTrigger>

                <SelectContent>
                  {availableYears.map(year => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Month */}
              {timeFrame === "month" && (
                <Select
                  value={selectedMonth ? String(selectedMonth) : ""}
                  onValueChange={(v) => setMonthPersisted(Number(v))}
                >
                  <SelectTrigger
                    className="
                      h-9
                      flex-1 min-[360px]:flex-none min-[360px]:w-1/2 sm:w-[140px]
                      bg-black/80 border border-white/20 backdrop-blur-xl
                      text-white/80
                      hover:bg-white/5 hover:border-white/20
                      transition
                    "
                  >
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>

                  <SelectContent>
                    {availableMonths.map(month => (
                      <SelectItem key={month} value={String(month)}>
                        {new Date(0, month - 1).toLocaleString('default', { month: 'long' })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Week */}
              {timeFrame === "week" && (
                <Select
                  value={selectedWeek ? String(selectedWeek) : ""}
                  onValueChange={(v) => setWeekPersisted(Number(v))}
                >
                  <SelectTrigger
                    className="
                      h-9
                      flex-1 min-[360px]:flex-none min-[360px]:w-1/2 sm:w-[140px]
                      bg-black/80 border border-white/20 backdrop-blur-xl
                      text-white/80
                      hover:bg-white/5 hover:border-white/20
                      transition
                    "
                  >
                    <SelectValue placeholder="Week" />
                  </SelectTrigger>

                  <SelectContent>
                    {availableWeeks.map(week => (
                      <SelectItem key={week} value={String(week)}>
                        Week {week}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

            </div>
          </div>
        </PageHeader>

        {/* Chart */}
        <div className="grid gap-8">
          <Card className="border border-white/20 bg-black/80 backdrop-blur-xl">
            <CardHeader>
              <CardTitle>Contribution Overview</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <ContributionChart data={filteredContributions} />
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <div className="mt-8">
          <Card className="border border-white/20 bg-black/80 backdrop-blur-xl">
            <CardHeader>
              <CardTitle>All Contributions</CardTitle>
            </CardHeader>
            <CardContent>
              <ContributionsTable
                columns={columns}
                data={filteredContributions}
                onRowClick={handleRowClick}
              />
            </CardContent>
          </Card>
        </div>

        {/* Add Contribution */}
        <AddContributionDialog
          isOpen={isAddDialogOpen}
          onClose={() => setIsAddDialogOpen(false)}
          members={members}
          churchId={churchId}
        />

        {/* Edit Contribution */}
        <EditContributionDialog
          contribution={selected}
          members={members}
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
        />

        {canEdit && (
          <Fab
            type="add"
            onClick={() => setIsAddDialogOpen(true)}
          />
        )}
      </ThemeProvider>
    </DashboardPage>
  );
}