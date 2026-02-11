'use client';

import { Button } from "@/app/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/app/components/ui/select";

interface AttendanceControlsProps {
  date: Date;
  setDate: (d: Date) => void;
  onHistory: () => void;
}

export function AttendanceControls({ date, setDate, onHistory }: AttendanceControlsProps) {
  const month = date.getMonth();
  const day = date.getDate();
  const year = date.getFullYear();

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i,
    label: new Date(0, i).toLocaleString("default", { month: "long" }),
  }));

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 0 + i);

  const clampDay = (d: Date) => {
    const max = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    if (d.getDate() > max) d.setDate(max);
  };

  return (
    // ⭐ This wrapper is clean — no blur, no transform, no opacity
    <div className="relative z-50">

      {/* ⭐ Blur is applied INSIDE, not on the positioned container */}
      <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg px-4 py-3 backdrop-blur-sm">

        <div />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 w-full sm:w-auto">

          {/* MONTH */}
          <Select
            value={String(month)}
            onValueChange={(value) => {
              const newDate = new Date(date);
              newDate.setMonth(Number(value));
              clampDay(newDate);
              setDate(newDate);
            }}
          >
            <SelectTrigger className="w-full sm:w-32 h-10 bg-black/40 border-white/10 text-white">
              <SelectValue placeholder="Month" />
            </SelectTrigger>

            {/* ⭐ popper + high z-index */}
            <SelectContent
              position="popper"
              className="z-50 max-h-48 overflow-y-auto"
            >
              {months.map((m) => (
                <SelectItem key={m.value} value={String(m.value)}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* DAY */}
          <Select
            value={String(day)}
            onValueChange={(value) => {
              const newDate = new Date(date);
              newDate.setDate(Number(value));
              setDate(newDate);
            }}
          >
            <SelectTrigger className="w-full sm:w-20 h-10 bg-black/40 border-white/10 text-white">
              <SelectValue placeholder="Day" />
            </SelectTrigger>

            <SelectContent
              position="popper"
              className="z-50 max-h-48 overflow-y-auto"
            >
              {days.map((d) => (
                <SelectItem key={d} value={String(d)}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* YEAR */}
          <Select
            value={String(year)}
            onValueChange={(value) => {
              const newDate = new Date(date);
              newDate.setFullYear(Number(value));
              clampDay(newDate);
              setDate(newDate);
            }}
          >
            <SelectTrigger className="w-full sm:w-24 h-10 bg-black/40 border-white/10 text-white">
              <SelectValue placeholder="Year" />
            </SelectTrigger>

            <SelectContent
              position="popper"
              className="z-50 max-h-48 overflow-y-auto"
            >
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => setDate(new Date())}
            className="h-10 px-4 border-white/20 text-white/80 hover:text-white hover:bg-white/10 w-full sm:w-auto"
          >
            Today
          </Button>

          <span className="text-white/30 select-none hidden sm:block">|</span>

          <Button
            variant="outline"
            onClick={onHistory}
            className="h-10 px-4 border-white/20 text-white/80 hover:text-white hover:bg-white/10 w-full sm:w-auto"
          >
            History
          </Button>
        </div>
      </div>
    </div>
  );
}
