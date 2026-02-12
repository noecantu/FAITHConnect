'use client';

import { Button } from '../ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../ui/select';

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
    label: new Date(0, i).toLocaleString('default', { month: 'long' }),
  }));

  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  return (
    <div className="space-y-4">

      {/* TOP CONTROLS — MATCHES CALENDAR EXACTLY */}
      <div className="flex justify-end w-full">
        <div className="
          flex flex-col 
          sm:flex-row 
          sm:items-center 
          sm:justify-end 
          gap-2 
          w-full 
          sm:w-auto
        ">

          {/* Month */}
          <Select
            value={String(month)}
            onValueChange={(value) => {
              const d = new Date(date);
              d.setMonth(Number(value));
              setDate(d);
            }}
          >
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              {months.map((m) => (
                <SelectItem key={m.value} value={String(m.value)}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Day */}
          <Select
            value={String(day)}
            onValueChange={(value) => {
              const d = new Date(date);
              d.setDate(Number(value));
              setDate(d);
            }}
          >
            <SelectTrigger className="w-full sm:w-20">
              <SelectValue placeholder="Day" />
            </SelectTrigger>
            <SelectContent>
              {days.map((d) => (
                <SelectItem key={d} value={String(d)}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Year */}
          <Select
            value={String(year)}
            onValueChange={(value) => {
              const d = new Date(date);
              d.setFullYear(Number(value));
              setDate(d);
            }}
          >
            <SelectTrigger className="w-full sm:w-24">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Today */}
          <Button
            variant="outline"
            onClick={() => setDate(new Date())}
            className="w-full sm:w-20"
          >
            Today
          </Button>

          {/* History */}
          <Button
            variant="outline"
            onClick={onHistory}
            className="w-full sm:w-24"
          >
            History
          </Button>

        </div>
      </div>
    </div>
  );
}
