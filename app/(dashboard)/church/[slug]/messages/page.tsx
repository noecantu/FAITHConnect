'use client';

import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/app/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Switch } from '@/app/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Fab } from '@/app/components/ui/fab';
import { useChurchId } from '@/app/hooks/useChurchId';
import { usePermissions } from '@/app/hooks/usePermissions';
import { useToast } from '@/app/hooks/use-toast';
import { BookOpenText, BellRing, Quote, Loader2, Check } from 'lucide-react';

type Visibility = 'all' | 'staff' | 'leaders' | 'admins';
type MessageType = 'quote' | 'verse' | 'reminder';

type DashboardMessage = {
  enabled: boolean;
  type: MessageType;
  title: string;
  message: string;
  reference: string;
  visibility: Visibility;
  startAt: string;
  endAt: string;
  updatedAt?: string;
};

const EMPTY_MESSAGE: DashboardMessage = {
  enabled: false,
  type: 'reminder',
  title: '',
  message: '',
  reference: '',
  visibility: 'all',
  startAt: '',
  endAt: '',
};

function toLocalDateInput(value?: string | null): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function MessagesModulePage() {
  const { churchId } = useChurchId();
  const { canReadMessages, canManageMessages, loading: loadingPermissions } = usePermissions();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCheck, setShowCheck] = useState(false);
  const [message, setMessage] = useState<DashboardMessage>(EMPTY_MESSAGE);
  const [original, setOriginal] = useState<DashboardMessage>(EMPTY_MESSAGE);

  useEffect(() => {
    if (!churchId) return;
    const activeChurchId = churchId;

    let isMounted = true;

    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/church/${encodeURIComponent(activeChurchId)}/dashboard-message`, {
          credentials: 'include',
        });

        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(typeof body.error === 'string' ? body.error : `HTTP ${res.status}`);
        }

        const raw = body.dashboardMessage;
        const normalized: DashboardMessage = raw
          ? {
              enabled: Boolean(raw.enabled),
              type: raw.type === 'quote' || raw.type === 'verse' ? raw.type : 'reminder',
              title: String(raw.title ?? ''),
              message: String(raw.message ?? ''),
              reference: String(raw.reference ?? ''),
              visibility:
                raw.visibility === 'staff' || raw.visibility === 'leaders' || raw.visibility === 'admins'
                  ? raw.visibility
                  : 'all',
              startAt: toLocalDateInput(raw.startAt),
              endAt: toLocalDateInput(raw.endAt),
              updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : undefined,
            }
          : EMPTY_MESSAGE;

        if (!isMounted) return;
        setMessage(normalized);
        setOriginal(normalized);
      } catch (err) {
        if (!isMounted) return;
        toast({
          title: 'Error',
          description: err instanceof Error ? err.message : 'Failed to load messages module.',
        });
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    void load();

    return () => {
      isMounted = false;
    };
  }, [churchId, toast]);

  const isDirty = useMemo(() => JSON.stringify(message) !== JSON.stringify(original), [message, original]);

  const previewIcon =
    message.type === 'quote' ? Quote : message.type === 'verse' ? BookOpenText : BellRing;

  const previewLabel =
    message.type === 'quote' ? 'Quote' : message.type === 'verse' ? 'Scripture' : 'Reminder';

  const scheduleInvalid = Boolean(message.startAt && message.endAt && new Date(message.endAt) < new Date(message.startAt));
  const hasContent = Boolean(message.title.trim() || message.message.trim() || message.reference.trim());
  const updatedLabel = message.updatedAt
    ? new Date(message.updatedAt).toLocaleString()
    : null;

  async function handleSave() {
    if (!churchId || !canManageMessages || !isDirty || scheduleInvalid) return;
    const activeChurchId = churchId;

    setSaving(true);
    try {
      const res = await fetch(`/api/church/${encodeURIComponent(activeChurchId)}/dashboard-message`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dashboardMessage: {
            enabled: message.enabled,
            type: message.type,
            title: message.title.trim(),
            message: message.message.trim(),
            reference: message.reference.trim(),
            visibility: message.visibility,
            startAt: message.startAt,
            endAt: message.endAt,
          },
        }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof body.error === 'string' ? body.error : `HTTP ${res.status}`);
      }

      const savedMessage: DashboardMessage = {
        ...message,
        updatedAt: new Date().toISOString(),
      };
      setMessage(savedMessage);
      setOriginal(savedMessage);
      setShowCheck(true);
      setTimeout(() => setShowCheck(false), 500);
      toast({ title: 'Saved', description: 'Messages module settings updated.' });
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to save message settings.',
      });
    } finally {
      setSaving(false);
    }
  }

  if (loadingPermissions || loading) {
    return (
      <>
        <PageHeader title="Messages" subtitle="Church-wide quotes, verses, and reminders." />
        <div className="h-32 bg-slate-900/40 rounded-xl animate-pulse" />
      </>
    );
  }

  if (!canReadMessages && !canManageMessages) {
    return (
      <>
        <PageHeader title="Messages" subtitle="Church-wide quotes, verses, and reminders." />
        <Card className="relative bg-black/80 border-white/20 backdrop-blur-xl">
          <CardContent className="p-6 text-sm text-muted-foreground">
            You do not have permission to access this module.
          </CardContent>
        </Card>
      </>
    );
  }

  const PreviewIcon = previewIcon;

  return (
    <>
      <PageHeader
        title="Messages"
        subtitle="Create and publish church messages for assigned audiences."
        className="mb-4"
      />

      <Card className="relative mb-6 overflow-hidden border-yellow-600/28 bg-gradient-to-br from-yellow-950/44 via-black/56 to-black/45 backdrop-blur-xl shadow-[0_8px_18px_rgba(202,138,4,0.14),inset_0_1px_0_rgba(202,138,4,0.1)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(202,138,4,0.15),transparent_60%)]" />
        <div className="pointer-events-none absolute -inset-x-12 -top-20 h-40 rotate-6 bg-[linear-gradient(90deg,transparent,rgba(202,138,4,0.12),transparent)] blur-xl animate-pulse" />
        <CardHeader className="relative">
          <CardTitle>Live Preview</CardTitle>
          <CardDescription>This is how your announcement appears in the dashboard.</CardDescription>
        </CardHeader>
        <CardContent className="relative">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${message.enabled ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300' : 'border-white/20 bg-white/10 text-white/60'}`}>
              {message.enabled ? 'Published' : 'Hidden'}
            </span>
            <span className="rounded-full border border-yellow-600/32 bg-yellow-700/14 px-2.5 py-0.5 text-xs font-semibold text-yellow-200/90">
              {previewLabel}
            </span>
            <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-xs text-white/70">
              Audience: {message.visibility}
            </span>
            {updatedLabel && (
              <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-xs text-white/60">
                Updated {updatedLabel}
              </span>
            )}
          </div>

          <div className="rounded-xl border border-yellow-600/28 bg-gradient-to-br from-yellow-950/44 via-black/56 to-black/45 p-5 shadow-[0_8px_18px_rgba(202,138,4,0.14),inset_0_1px_0_rgba(202,138,4,0.1)]">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-yellow-600/35 bg-yellow-700/16 text-yellow-200/90 shadow-[0_0_8px_rgba(202,138,4,0.16)]">
                <PreviewIcon className="h-4 w-4" />
              </span>
              <div className="min-w-0 space-y-1.5">
                {message.title && <p className="text-base font-semibold text-white/90">{message.title}</p>}
                <p className="whitespace-pre-wrap text-sm leading-6 text-white/80">
                  {message.message || 'Your message preview appears here.'}
                </p>
                {message.reference && (
                  <p className="text-xs font-medium tracking-wide text-yellow-200/95">{message.reference}</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="relative bg-black/80 border-white/20 backdrop-blur-xl">
        <CardHeader>
          <CardTitle>Message Configuration</CardTitle>
          <CardDescription>Manage publishing, visibility, content, and scheduling in one place.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-lg border border-white/10 bg-black/35 p-4 min-h-[112px] flex flex-col justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">Publish Message</p>
                <p className="text-xs text-white/65">Control if this appears for users.</p>
              </div>
              <div className="flex justify-end pt-2">
                <Switch
                  checked={message.enabled}
                  onCheckedChange={(checked) => setMessage((prev) => ({ ...prev, enabled: checked }))}
                  disabled={!canManageMessages}
                />
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-black/35 p-4 min-h-[112px] flex flex-col justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">Message Type</p>
                <p className="text-xs text-white/65">Choose quote, verse, or reminder.</p>
              </div>
              <Select
                value={message.type}
                onValueChange={(value) => setMessage((prev) => ({ ...prev, type: value as MessageType }))}
                disabled={!canManageMessages}
              >
                <SelectTrigger className="mt-2 bg-black/40 border-white/20">
                  <SelectValue placeholder="Choose type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quote">Quote</SelectItem>
                  <SelectItem value="verse">Scripture</SelectItem>
                  <SelectItem value="reminder">Reminder</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-lg border border-white/10 bg-black/35 p-4 min-h-[112px] flex flex-col justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">Visibility</p>
                <p className="text-xs text-white/65">Set who can view this message.</p>
              </div>
              <Select
                value={message.visibility}
                onValueChange={(value) => setMessage((prev) => ({ ...prev, visibility: value as Visibility }))}
                disabled={!canManageMessages}
              >
                <SelectTrigger className="mt-2 bg-black/40 border-white/20">
                  <SelectValue placeholder="Who can view" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Public</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="leaders">Leadership</SelectItem>
                  <SelectItem value="admins">Administrators</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-black/25 p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <p className="text-sm font-medium">Title (optional)</p>
                <Input
                  value={message.title}
                  onChange={(e) => setMessage((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Ex: Verse of the Week"
                  className="bg-black/40 border-white/20"
                  disabled={!canManageMessages}
                />
              </div>

              <div className="space-y-1.5">
                <p className="text-sm font-medium">Reference (optional)</p>
                <Input
                  value={message.reference}
                  onChange={(e) => setMessage((prev) => ({ ...prev, reference: e.target.value }))}
                  placeholder="Ex: Proverbs 3:5-6"
                  className="bg-black/40 border-white/20"
                  disabled={!canManageMessages}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="text-sm font-medium">Message</p>
              <Textarea
                value={message.message}
                onChange={(e) => setMessage((prev) => ({ ...prev, message: e.target.value }))}
                rows={8}
                maxLength={800}
                placeholder="Enter your church quote, verse, or reminder."
                className="bg-black/40 border-white/20"
                disabled={!canManageMessages}
              />
              <div className="flex items-center justify-between text-xs text-white/55">
                <span>{hasContent ? 'Looks good. Keep messages concise for mobile readability.' : 'Add content to preview your dashboard message.'}</span>
                <span>{message.message.length}/800</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-black/25 p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <p className="text-sm font-medium">Start Date (optional)</p>
                <Input
                  type="datetime-local"
                  value={message.startAt}
                  onChange={(e) => setMessage((prev) => ({ ...prev, startAt: e.target.value }))}
                  className="bg-black/40 border-white/20"
                  disabled={!canManageMessages}
                />
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-medium">End Date (optional)</p>
                <Input
                  type="datetime-local"
                  value={message.endAt}
                  onChange={(e) => setMessage((prev) => ({ ...prev, endAt: e.target.value }))}
                  className="bg-black/40 border-white/20"
                  disabled={!canManageMessages}
                />
              </div>
            </div>
          </div>

          {scheduleInvalid && (
            <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200">
              End date must be after start date.
            </div>
          )}
        </CardContent>
      </Card>

      {canManageMessages && (
        <Fab
          type="save"
          onClick={() => void handleSave()}
          disabled={(!isDirty && !saving) || scheduleInvalid}
          className={`
            transition-all duration-500
            ${((!isDirty && !saving) || scheduleInvalid) ? 'opacity-40' : 'opacity-100'}
          `}
        >
          {saving && <Loader2 className="h-5 w-5 animate-spin" />}
          {!saving && showCheck && (
            <Check className="h-5 w-5 animate-pulse" />
          )}
          {!saving && !showCheck && <Check className="h-5 w-5" />}
        </Fab>
      )}
    </>
  );
}
