'use client';

import { useState } from 'react';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Separator } from '@/app/components/ui/separator';
import { cn } from '@/app/lib/utils';
import { Eye, EyeOff, Lock, ShieldAlert } from 'lucide-react';

import RoleSelector from './RoleSelector';
import PermissionSelector from './PermissionSelector';
import type { Mode } from '@/app/lib/types';
import type { Role } from '@/app/lib/auth/roles';
import type { Permission } from '@/app/lib/auth/permissions';
import { can } from '@/app/lib/auth/permissions';

interface Props {
  mode: Mode;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  selectedRoles: Role[];
  selectedPermissions: Permission[];
  regionName: string;

  setFirstName: (v: string) => void;
  setLastName: (v: string) => void;
  setEmail: (v: string) => void;
  setPassword: (v: string) => void;
  setRegionName: (v: string) => void;

  onRoleChange: (role: Role, checked: boolean) => void;
  onPermissionChange: (permission: Permission, checked: boolean) => void;

  onCreate: () => void;
  onSave: () => void;
  onDelete: () => void;
  onClose: () => void;

  isCreating: boolean;
  isSaving: boolean;
  isTransferringBillingOwner: boolean;

  isBillingOwner: boolean;
  canTransferBillingOwner: boolean;
  onTransferBillingOwner: () => void;

  currentUserId: string;
  currentUserRoles: Role[];
  targetUserId?: string;
}

function UserInitials({ firstName, lastName }: { firstName: string; lastName: string }) {
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || '?';
  return (
    <div className="h-10 w-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
      <span className="text-sm font-semibold text-primary">{initials}</span>
    </div>
  );
}

export default function UserFormCard({
  mode,
  firstName,
  lastName,
  email,
  password,
  selectedRoles,
  selectedPermissions,
  regionName,

  setFirstName,
  setLastName,
  setEmail,
  setPassword,
  setRegionName,

  onRoleChange,
  onPermissionChange,
  onCreate,
  onSave,
  onDelete,
  onClose,

  isCreating,
  isSaving,
  isTransferringBillingOwner,

  isBillingOwner,
  canTransferBillingOwner,
  onTransferBillingOwner,

  currentUserId,
  currentUserRoles,
  targetUserId,
}: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<'account' | 'access'>('account');

  const isRegionalAdmin = selectedRoles.includes('RegionalAdmin');
  const targetIsChurchAdmin = selectedRoles.includes('Admin');
  const canAssignPerms = can(currentUserRoles, 'roles.assign');
  const callerIsSystemUser = can(currentUserRoles, 'system.manage');
  const showAccessTab = !callerIsSystemUser || mode === 'create';

  const isCreate = mode === 'create';

  return (
    <Card className="bg-black/80 border-white/20 backdrop-blur-xl overflow-hidden">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-white/10">
        {!isCreate && (
          <UserInitials firstName={firstName} lastName={lastName} />
        )}

        <div className="flex-1 min-w-0">
          <h2 className="text-base font-semibold leading-tight">
            {isCreate ? 'New User Account' : `${firstName} ${lastName}`.trim() || 'Edit User'}
          </h2>
          {!isCreate && (
            <p className="text-xs text-muted-foreground truncate">{email}</p>
          )}
        </div>

        {isBillingOwner && (
          <span className="inline-flex items-center rounded-full border border-cyan-300/40 bg-cyan-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cyan-200 flex-shrink-0">
            Billing Owner
          </span>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className="flex flex-col">
        {/* Tab toggle */}
        {showAccessTab && (
          <div className="px-6 pt-4">
            <div className="grid grid-cols-2 gap-0.5 rounded-lg bg-white/[0.04] border border-white/10 p-1">
              {(['account', 'access'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    'relative rounded-md py-1.5 text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                    activeTab === tab
                      ? 'bg-white/10 text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground/80'
                  )}
                >
                  {tab === 'account' ? 'Account' : 'Role & Access'}
                  {activeTab === tab && (
                    <span className="absolute inset-x-3 bottom-0 h-px bg-primary/60 rounded-full" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Account Tab ── */}
        <div className={cn('px-6 pb-6 pt-4 space-y-4', activeTab !== 'account' && 'hidden')}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>First Name</Label>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Last Name</Label>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                autoComplete="off"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Email</Label>
            {isCreate ? (
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="off"
              />
            ) : (
              <div className="flex items-center gap-2 h-9 px-3 rounded-md border border-white/10 bg-white/5 text-sm text-muted-foreground">
                <Lock className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{email}</span>
              </div>
            )}
            {!isCreate && (
              <p className="text-[11px] text-muted-foreground">
                Email cannot be changed after account creation.
              </p>
            )}
          </div>

          {isCreate && (
            <div className="space-y-1.5">
              <Label>Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  autoComplete="new-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}

          {isRegionalAdmin && (
            <div className="space-y-1.5">
              <Label>Region Name</Label>
              <Input
                value={regionName}
                onChange={(e) => setRegionName(e.target.value)}
                placeholder="e.g. North Panhandle Zone"
              />
            </div>
          )}
        </div>

        {/* ── Role & Access Tab ── */}
        {showAccessTab && (
          <div className={cn('px-6 pb-6 pt-4 space-y-5', activeTab !== 'access' && 'hidden')}>
            <div className="space-y-2">
              <div>
                <p className="text-sm font-medium">Church Role</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Organizational title only — does not grant module access.
                </p>
              </div>
              <RoleSelector
                selectedRoles={selectedRoles}
                onChange={onRoleChange}
                currentUserId={currentUserId}
                currentUserRoles={currentUserRoles}
                targetUserId={targetUserId ?? ''}
              />
            </div>

            <Separator className="bg-white/10" />

            <div className="space-y-2">
              <div>
                <p className="text-sm font-medium">Module Access</p>
                {targetIsChurchAdmin ? (
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                    <ShieldAlert className="h-3 w-3 text-primary" />
                    Church Administrators have full access to all modules.
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Set what each user can view or edit. No access means the section is hidden.
                  </p>
                )}
              </div>

              {!targetIsChurchAdmin && canAssignPerms && (
                <PermissionSelector
                  selectedPermissions={selectedPermissions}
                  onChange={onPermissionChange}
                />
              )}

              {!targetIsChurchAdmin && !canAssignPerms && (
                <p className="text-xs text-muted-foreground italic">
                  You do not have permission to change module access.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="px-6 pb-6">
        <Separator className="bg-white/10 mb-4" />
        <div className="flex items-center justify-between gap-3">
          {/* Left: destructive actions */}
          <div className="flex items-center gap-2">
            {!isCreate && (
              <Button
                variant="outline"
                size="sm"
                onClick={onDelete}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 px-3"
              >
                Delete
              </Button>
            )}
          </div>

          {/* Right: primary + billing actions */}
          <div className="flex items-center gap-2">
            {!isCreate && canTransferBillingOwner && !isBillingOwner && (
              <Button
                variant="outline"
                size="sm"
                onClick={onTransferBillingOwner}
                disabled={isTransferringBillingOwner}
                className="hidden sm:flex"
              >
                {isTransferringBillingOwner ? 'Transferring…' : 'Set as Billing Owner'}
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
            >
              Cancel
            </Button>

            {isCreate ? (
              <Button size="sm" onClick={onCreate} disabled={isCreating}>
                {isCreating ? 'Creating…' : 'Create Account'}
              </Button>
            ) : (
              <Button size="sm" onClick={onSave} disabled={isSaving}>
                {isSaving ? 'Saving…' : 'Save'}
              </Button>
            )}
          </div>
        </div>

        {/* Billing owner transfer — visible on mobile only */}
        {!isCreate && canTransferBillingOwner && !isBillingOwner && (
          <div className="mt-2 sm:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={onTransferBillingOwner}
              disabled={isTransferringBillingOwner}
              className="w-full"
            >
              {isTransferringBillingOwner ? 'Transferring…' : 'Set as Billing Owner'}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
