'use client';

import { cn } from '@/app/lib/utils';
import type { Permission } from '@/app/lib/auth/permissions';
import type { LucideIcon } from 'lucide-react';
import {
  CalendarDays,
  CheckSquare2,
  DollarSign,
  Music2,
  Users,
  ClipboardList,
  BarChart2,
  ListMusic,
  CalendarHeart,
  MessageSquare,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

type ModuleLevel = 'none' | 'view' | 'edit';
type ReportLevel = 'none' | 'view';

interface ModuleConfig {
  label: string;
  icon: LucideIcon;
  viewPermission: Permission;
  editPermission: Permission;
  levels?: { value: ModuleLevel; label: string }[];
}

interface ReportConfig {
  label: string;
  icon: LucideIcon;
  permission: Permission;
}

// ── Data ──────────────────────────────────────────────────────────────────────

const MODULES: ModuleConfig[] = [
  { label: 'Attendance',    icon: CheckSquare2,  viewPermission: 'attendance.read',    editPermission: 'attendance.manage'    },
  { label: 'Calendar',      icon: CalendarDays,  viewPermission: 'events.read',        editPermission: 'events.manage'        },
  { label: 'Contributions', icon: DollarSign,    viewPermission: 'contributions.read', editPermission: 'contributions.manage' },
  { label: 'Members',       icon: Users,         viewPermission: 'members.read',       editPermission: 'members.manage'       },
  {
    label: 'Messages',
    icon: MessageSquare,
    viewPermission: 'messages.read',
    editPermission: 'messages.manage',
    levels: [
      { value: 'none', label: 'None' },
      { value: 'edit', label: 'Edit' },
    ],
  },
  { label: 'Service Plans', icon: ClipboardList, viewPermission: 'servicePlans.read',  editPermission: 'servicePlans.manage'  },
  { label: 'Set Lists',     icon: ListMusic,     viewPermission: 'setlists.read',      editPermission: 'setlists.manage'      },
  { label: 'Songs',         icon: Music2,        viewPermission: 'songs.read',         editPermission: 'songs.manage'         },
];

const REPORTS: ReportConfig[] = [
  { label: 'Attendance',     icon: CheckSquare2,  permission: 'reports.attendance'    },
  { label: 'Contributions',  icon: DollarSign,    permission: 'reports.contributions' },
  { label: 'Members',        icon: Users,         permission: 'reports.members'       },
  { label: 'Service Plans',  icon: CalendarHeart, permission: 'reports.serviceplans'  },
  { label: 'Set Lists',      icon: ListMusic,     permission: 'reports.setlists'      },
];

const MODULE_LEVELS: { value: ModuleLevel; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'view', label: 'View' },
  { value: 'edit', label: 'Edit' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function getModuleLevel(perms: Permission[], mod: ModuleConfig): ModuleLevel {
  if (perms.includes(mod.editPermission)) return 'edit';
  if (perms.includes(mod.viewPermission)) return 'view';
  return 'none';
}

function applyModuleLevel(current: Permission[], mod: ModuleConfig, level: ModuleLevel): Permission[] {
  const stripped = current.filter((p) => p !== mod.viewPermission && p !== mod.editPermission);
  if (level === 'view') return [...stripped, mod.viewPermission];
  if (level === 'edit') return [...stripped, mod.editPermission];
  return stripped;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SegmentedToggle<T extends string>({
  options,
  value,
  onChange,
  disabled,
  activeClass,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  disabled?: boolean;
  activeClass: (v: T) => string;
}) {
  return (
    <div
      className={cn(
        'inline-flex rounded-md border border-white/10 overflow-hidden divide-x divide-white/10',
        disabled && 'opacity-50'
      )}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          disabled={disabled}
          onClick={() => onChange(opt.value)}
          className={cn(
            'px-3 h-7 text-xs font-medium transition-colors',
            value === opt.value ? activeClass(opt.value) : 'text-muted-foreground hover:bg-white/5 hover:text-foreground',
            disabled && 'cursor-not-allowed'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  selectedPermissions: Permission[];
  onChange: (permission: Permission, checked: boolean) => void;
  disabled?: boolean;
}

export default function PermissionSelector({ selectedPermissions, onChange, disabled }: Props) {
  function handleModuleLevel(mod: ModuleConfig, level: ModuleLevel) {
    const next = applyModuleLevel(selectedPermissions, mod, level);
    const toRemove = selectedPermissions.filter((p) => !next.includes(p));
    const toAdd = next.filter((p) => !selectedPermissions.includes(p));
    toRemove.forEach((p) => onChange(p, false));
    toAdd.forEach((p) => onChange(p, true));
  }

  function handleReportLevel(permission: Permission, level: ReportLevel) {
    onChange(permission, level === 'view');
  }

  function moduleActiveClass(v: ModuleLevel): string {
    if (v === 'view') return 'bg-blue-500/15 text-blue-300 border-x border-blue-500/30';
    if (v === 'edit') return 'bg-emerald-500/15 text-emerald-300 border-x border-emerald-500/30';
    return 'bg-white/8 text-foreground';
  }

  function reportActiveClass(v: ReportLevel): string {
    if (v === 'view') return 'bg-blue-500/15 text-blue-300 border-x border-blue-500/30';
    return 'bg-white/8 text-foreground';
  }

  return (
    <div className="space-y-3">
      {/* ── Module rows ── */}
      <div className="rounded-md border border-white/10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 bg-white/[0.025] border-b border-white/10">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
            Module
          </span>
          <div className="flex gap-[1px] pr-px">
            {MODULE_LEVELS.map((l) => (
              <span
                key={l.value}
                className="w-[52px] text-center text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50"
              >
                {l.label}
              </span>
            ))}
          </div>
        </div>

        {/* Rows */}
        {MODULES.map((mod, i) => {
          const level = getModuleLevel(selectedPermissions, mod);
          const levelOptions = mod.levels ?? MODULE_LEVELS;
          const Icon = mod.icon;
          return (
            <div
              key={mod.label}
              className={cn(
                'flex items-center justify-between px-3 py-2.5 transition-colors',
                level !== 'none' ? 'bg-white/[0.02]' : '',
                i < MODULES.length - 1 && 'border-b border-white/[0.06]'
              )}
            >
              <div className={cn('flex items-center gap-2.5 transition-opacity', level === 'none' && 'opacity-40')}>
                <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="text-sm">{mod.label}</span>
              </div>
              <SegmentedToggle
                options={levelOptions}
                value={level}
                onChange={(v) => handleModuleLevel(mod, v)}
                disabled={disabled}
                activeClass={moduleActiveClass}
              />
            </div>
          );
        })}
      </div>

      {/* ── Reports section ── */}
      <div className="rounded-md border border-white/10 overflow-hidden">
        <div className="px-3 py-2 bg-white/[0.025] border-b border-white/10 flex items-center gap-2">
          <BarChart2 className="h-3 w-3 text-muted-foreground/50" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
            Reports
          </span>
        </div>
        {REPORTS.map((report, i) => {
          const active = selectedPermissions.includes(report.permission);
          const level: ReportLevel = active ? 'view' : 'none';
          return (
            <div
              key={report.permission}
              className={cn(
                'flex items-center justify-between px-3 py-2.5 transition-colors',
                active ? 'bg-white/[0.02]' : '',
                i < REPORTS.length - 1 && 'border-b border-white/[0.06]'
              )}
            >
              <div className={cn('flex items-center gap-2.5 transition-opacity', !active && 'opacity-40')}>
                <report.icon className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="text-sm">{report.label}</span>
              </div>
              <SegmentedToggle
                options={[
                  { value: 'none' as ReportLevel, label: 'None' },
                  { value: 'view' as ReportLevel, label: 'View' },
                ]}
                value={level}
                onChange={(v) => handleReportLevel(report.permission, v)}
                disabled={disabled}
                activeClass={reportActiveClass}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

