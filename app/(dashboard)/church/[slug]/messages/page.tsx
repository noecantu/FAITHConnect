'use client';

import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/app/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Button } from '@/app/components/ui/button';
import { useChurchId } from '@/app/hooks/useChurchId';
import { usePermissions } from '@/app/hooks/usePermissions';
import { useToast } from '@/app/hooks/use-toast';
import { BookOpenText, BellRing, Quote, MessageCircle, TriangleAlert, Loader2, Check, Plus, Trash2 } from 'lucide-react';

type Visibility = 'all' | 'staff' | 'leaders' | 'admins';
type MessageType = 'quote' | 'verse' | 'reminder' | 'general' | 'alert';

type DashboardMessage = {
  id: string;
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

function createEmptyMessage(): DashboardMessage {
  return {
    id: crypto.randomUUID(),
    enabled: false,
    type: 'reminder',
    title: '',
    message: '',
    reference: '',
    visibility: 'all',
    startAt: '',
    endAt: '',
  };
}

function toLocalDateInput(value?: string | null): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function normalizeMessage(raw: unknown): DashboardMessage | null {
  if (!raw || typeof raw !== 'object') return null;

  const data = raw as Record<string, unknown>;

  return {
    id: typeof data.id === 'string' && data.id.trim() ? data.id : crypto.randomUUID(),
    enabled: Boolean(data.enabled),
    type:
      data.type === 'quote' || data.type === 'verse' || data.type === 'general' || data.type === 'alert'
        ? data.type
        : 'reminder',
    title: String(data.title ?? ''),
    message: String(data.message ?? ''),
    reference: String(data.reference ?? ''),
    visibility:
      data.visibility === 'staff' || data.visibility === 'leaders' || data.visibility === 'admins'
        ? data.visibility
        : 'all',
    startAt: toLocalDateInput(typeof data.startAt === 'string' ? data.startAt : null),
    endAt: toLocalDateInput(typeof data.endAt === 'string' ? data.endAt : null),
    updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : undefined,
  };
}

function normalizeMessages(raw: unknown): DashboardMessage[] {
  if (Array.isArray(raw)) {
    return raw
      .map((entry) => normalizeMessage(entry))
      .filter((entry): entry is DashboardMessage => entry !== null);
  }

  const single = normalizeMessage(raw);
  return single ? [single] : [];
}

function hasInvalidSchedule(message: DashboardMessage): boolean {
  return Boolean(
    message.startAt &&
      message.endAt &&
      new Date(message.endAt) < new Date(message.startAt)
  );
}

function getThemeClasses(type: MessageType) {
  if (type === 'alert') {
    return {
      card:
        'border-red-600/35 bg-gradient-to-br from-red-950/44 via-black/56 to-black/45 shadow-[0_8px_18px_rgba(220,38,38,0.14),inset_0_1px_0_rgba(220,38,38,0.1)]',
      listSelected: 'border-red-500/55 bg-red-900/24 shadow-[0_0_0_1px_rgba(248,113,113,0.2)]',
      listIdle: 'border-red-600/22 bg-black/30 hover:border-red-500/38 hover:bg-black/40',
      focusRing: 'focus-visible:ring-red-500/60',
      glow: 'bg-[radial-gradient(circle_at_top_right,rgba(220,38,38,0.15),transparent_60%)]',
      shimmer:
        'bg-[linear-gradient(90deg,transparent,rgba(220,38,38,0.12),transparent)]',
      icon: 'border-red-600/35 bg-red-700/16 text-red-200/90 shadow-[0_0_8px_rgba(220,38,38,0.16)]',
      badge: 'border-red-600/32 bg-red-700/14 text-red-200/90',
      reference: 'text-red-200/95',
    };
  }

  if (type === 'general') {
    return {
      card:
        'border-slate-500/35 bg-gradient-to-br from-slate-900/44 via-black/56 to-black/45 shadow-[0_8px_18px_rgba(100,116,139,0.14),inset_0_1px_0_rgba(100,116,139,0.1)]',
      listSelected: 'border-slate-400/55 bg-slate-800/30 shadow-[0_0_0_1px_rgba(148,163,184,0.2)]',
      listIdle: 'border-slate-600/22 bg-black/30 hover:border-slate-500/38 hover:bg-black/40',
      focusRing: 'focus-visible:ring-slate-400/60',
      glow: 'bg-[radial-gradient(circle_at_top_right,rgba(100,116,139,0.15),transparent_60%)]',
      shimmer:
        'bg-[linear-gradient(90deg,transparent,rgba(100,116,139,0.12),transparent)]',
      icon: 'border-slate-500/35 bg-slate-700/16 text-slate-200/90 shadow-[0_0_8px_rgba(100,116,139,0.16)]',
      badge: 'border-slate-500/32 bg-slate-700/14 text-slate-200/90',
      reference: 'text-slate-200/95',
    };
  }

  if (type === 'quote') {
    return {
      card:
        'border-purple-600/35 bg-gradient-to-br from-purple-950/44 via-black/56 to-black/45 shadow-[0_8px_18px_rgba(147,51,234,0.14),inset_0_1px_0_rgba(147,51,234,0.1)]',
      listSelected: 'border-purple-500/55 bg-purple-900/24 shadow-[0_0_0_1px_rgba(168,85,247,0.2)]',
      listIdle: 'border-purple-600/22 bg-black/30 hover:border-purple-500/38 hover:bg-black/40',
      focusRing: 'focus-visible:ring-purple-500/60',
      glow: 'bg-[radial-gradient(circle_at_top_right,rgba(147,51,234,0.15),transparent_60%)]',
      shimmer:
        'bg-[linear-gradient(90deg,transparent,rgba(147,51,234,0.12),transparent)]',
      icon: 'border-purple-600/35 bg-purple-700/16 text-purple-200/90 shadow-[0_0_8px_rgba(147,51,234,0.16)]',
      badge: 'border-purple-600/32 bg-purple-700/14 text-purple-200/90',
      reference: 'text-purple-200/95',
    };
  }

  if (type === 'verse') {
    return {
      card:
        'border-blue-600/35 bg-gradient-to-br from-blue-950/44 via-black/56 to-black/45 shadow-[0_8px_18px_rgba(37,99,235,0.14),inset_0_1px_0_rgba(37,99,235,0.1)]',
      listSelected: 'border-blue-500/55 bg-blue-900/24 shadow-[0_0_0_1px_rgba(59,130,246,0.2)]',
      listIdle: 'border-blue-600/22 bg-black/30 hover:border-blue-500/38 hover:bg-black/40',
      focusRing: 'focus-visible:ring-blue-500/60',
      glow: 'bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.15),transparent_60%)]',
      shimmer:
        'bg-[linear-gradient(90deg,transparent,rgba(37,99,235,0.12),transparent)]',
      icon: 'border-blue-600/35 bg-blue-700/16 text-blue-200/90 shadow-[0_0_8px_rgba(37,99,235,0.16)]',
      badge: 'border-blue-600/32 bg-blue-700/14 text-blue-200/90',
      reference: 'text-blue-200/95',
    };
  }

  return {
    card:
      'border-yellow-600/35 bg-gradient-to-br from-yellow-950/44 via-black/56 to-black/45 shadow-[0_8px_18px_rgba(202,138,4,0.14),inset_0_1px_0_rgba(202,138,4,0.1)]',
    listSelected: 'border-yellow-500/55 bg-yellow-900/24 shadow-[0_0_0_1px_rgba(234,179,8,0.2)]',
    listIdle: 'border-yellow-600/22 bg-black/30 hover:border-yellow-500/38 hover:bg-black/40',
    focusRing: 'focus-visible:ring-yellow-500/60',
    glow: 'bg-[radial-gradient(circle_at_top_right,rgba(202,138,4,0.15),transparent_60%)]',
    shimmer:
      'bg-[linear-gradient(90deg,transparent,rgba(202,138,4,0.12),transparent)]',
    icon: 'border-yellow-600/35 bg-yellow-700/16 text-yellow-200/90 shadow-[0_0_8px_rgba(202,138,4,0.16)]',
    badge: 'border-yellow-600/32 bg-yellow-700/14 text-yellow-200/90',
    reference: 'text-yellow-200/95',
  };
}

export default function MessagesModulePage() {
  const { churchId } = useChurchId();
  const { canReadMessages, canManageMessages, loading: loadingPermissions } = usePermissions();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCheck, setShowCheck] = useState(false);
  const [messages, setMessages] = useState<DashboardMessage[]>([createEmptyMessage()]);
  const [originalMessages, setOriginalMessages] = useState<DashboardMessage[]>([createEmptyMessage()]);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);

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

        const loadedMessages = normalizeMessages(
          Array.isArray(body.dashboardMessages) || body.dashboardMessages
            ? body.dashboardMessages
            : body.dashboardMessage
        );
        const editorMessages = loadedMessages.length ? loadedMessages : [createEmptyMessage()];

        if (!isMounted) return;
        setMessages(editorMessages);
        setOriginalMessages(editorMessages);
        setSelectedMessageId(editorMessages[0]?.id ?? null);
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

  useEffect(() => {
    if (!messages.length) {
      setSelectedMessageId(null);
      return;
    }

    if (!selectedMessageId || !messages.some((entry) => entry.id === selectedMessageId)) {
      setSelectedMessageId(messages[0].id);
    }
  }, [messages, selectedMessageId]);

  const selectedMessage = useMemo(
    () => messages.find((entry) => entry.id === selectedMessageId) ?? messages[0] ?? null,
    [messages, selectedMessageId]
  );

  const isDirty = useMemo(
    () => JSON.stringify(messages) !== JSON.stringify(originalMessages),
    [messages, originalMessages]
  );

  const previewIcon =
    selectedMessage?.type === 'quote' ? Quote
    : selectedMessage?.type === 'verse' ? BookOpenText
    : selectedMessage?.type === 'alert' ? TriangleAlert
    : selectedMessage?.type === 'general' ? MessageCircle
    : BellRing;

  const previewLabel =
    selectedMessage?.type === 'quote' ? 'Quote'
    : selectedMessage?.type === 'verse' ? 'Scripture'
    : selectedMessage?.type === 'alert' ? 'Alert'
    : selectedMessage?.type === 'general' ? 'General'
    : 'Reminder';
  const previewTheme = getThemeClasses(selectedMessage?.type ?? 'reminder');

  const selectedHasContent = Boolean(
    selectedMessage?.title.trim() ||
      selectedMessage?.message.trim() ||
      selectedMessage?.reference.trim()
  );
  const selectedHasMessageText = Boolean(selectedMessage?.message.trim());

  const updatedLabel = selectedMessage?.updatedAt
    ? new Date(selectedMessage.updatedAt).toLocaleString()
    : null;

  const hasAnyInvalidSchedule = messages.some((entry) => hasInvalidSchedule(entry));

  function updateMessage(id: string, patch: Partial<DashboardMessage>) {
    setMessages((current) => current.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)));
  }

  function handleAddMessage() {
    const nextMessage = createEmptyMessage();
    setMessages((current) => [...current, nextMessage]);
    setSelectedMessageId(nextMessage.id);
  }

  function handleRemoveMessage(id: string) {
    setMessages((current) => {
      if (current.length === 1) {
        const blankMessage = createEmptyMessage();
        setSelectedMessageId(blankMessage.id);
        return [blankMessage];
      }

      const remaining = current.filter((entry) => entry.id !== id);
      if (selectedMessageId === id) {
        setSelectedMessageId(remaining[0]?.id ?? null);
      }
      return remaining;
    });
  }

  async function handleSave() {
    if (!churchId || !canManageMessages || !isDirty || hasAnyInvalidSchedule) return;
    const activeChurchId = churchId;

    setSaving(true);
    try {
      const res = await fetch(`/api/church/${encodeURIComponent(activeChurchId)}/dashboard-message`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dashboardMessages: messages.map((entry) => ({
            id: entry.id,
            enabled: entry.enabled,
            type: entry.type,
            title: entry.title.trim(),
            message: entry.message.trim(),
            reference: entry.reference.trim(),
            visibility: entry.visibility,
            startAt: entry.startAt,
            endAt: entry.endAt,
          })),
        }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof body.error === 'string' ? body.error : `HTTP ${res.status}`);
      }

      const savedMessages = normalizeMessages(body.dashboardMessages);
      const editorMessages = savedMessages.length ? savedMessages : [createEmptyMessage()];
      setMessages(editorMessages);
      setOriginalMessages(editorMessages);
      setSelectedMessageId((current) =>
        current && editorMessages.some((entry) => entry.id === current)
          ? current
          : editorMessages[0]?.id ?? null
      );
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
        <div className="h-32 rounded-xl bg-slate-900/40 animate-pulse" />
      </>
    );
  }

  if (!canReadMessages && !canManageMessages) {
    return (
      <>
        <PageHeader title="Messages" subtitle="Church-wide quotes, verses, and reminders." />
        <Card className="relative border-white/20 bg-black/80 backdrop-blur-xl">
          <CardContent className="p-6 text-sm text-muted-foreground">
            You do not have permission to access this module.
          </CardContent>
        </Card>
      </>
    );
  }

  if (!selectedMessage) {
    return null;
  }

  const PreviewIcon = previewIcon;

  return (
    <>
      <PageHeader
        title="Messages"
        subtitle="Create and publish church messages for assigned audiences."
        className="mb-4"
      />

      <Card className="relative mb-6 border-white/20 bg-black/80 backdrop-blur-xl">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Message List</CardTitle>
            <CardDescription>Add multiple messages and target each one independently.</CardDescription>
          </div>
          {canManageMessages && (
            <Button onClick={handleAddMessage} className="bg-yellow-700 text-black hover:bg-yellow-600">
              <Plus className="h-4 w-4" />
              Add Message
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {messages.map((entry, index) => {
              const isSelected = entry.id === selectedMessage.id;
              const label =
                entry.type === 'quote' ? 'Quote'
                : entry.type === 'verse' ? 'Scripture'
                : entry.type === 'alert' ? 'Alert'
                : entry.type === 'general' ? 'General'
                : 'Reminder';
              const summary = entry.message.trim() || 'No content yet.';
              const entryTheme = getThemeClasses(entry.type);

              return (
                <div
                  key={entry.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedMessageId(entry.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setSelectedMessageId(entry.id);
                    }
                  }}
                  className={`rounded-xl border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 ${entryTheme.focusRing} ${
                    isSelected ? entryTheme.listSelected : entryTheme.listIdle
                  }`}
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-white/90">
                        {entry.title.trim() || `Message ${index + 1}`}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-wide text-white/55">
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wider ${entryTheme.badge}`}>
                          {label}
                        </span>
                        <span>{entry.visibility}</span>
                        <span>{entry.enabled ? 'Published' : 'Hidden'}</span>
                      </div>
                    </div>
                    {canManageMessages && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-white/55 hover:text-red-300"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleRemoveMessage(entry.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <p className="line-clamp-3 text-sm leading-6 text-white/70">{summary}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className={`relative mb-6 overflow-hidden border-2 backdrop-blur-xl ${previewTheme.card}`}>
        <div className={`pointer-events-none absolute inset-0 opacity-40 ${previewTheme.glow}`} />
        <div
          className={`pointer-events-none absolute -inset-x-12 -top-20 h-40 rotate-6 blur-xl opacity-25 ${previewTheme.shimmer}`}
        />
        <CardHeader className="relative">
          <CardTitle>Live Preview</CardTitle>
          <CardDescription>This is how the selected announcement appears in the dashboard.</CardDescription>
        </CardHeader>
        <CardContent className="relative">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${selectedMessage.enabled ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300' : 'border-white/20 bg-white/10 text-white/60'}`}>
              {selectedMessage.enabled ? 'Published' : 'Hidden'}
            </span>
            <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${previewTheme.badge}`}>
              {previewLabel}
            </span>
            <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-xs text-white/70">
              Audience: {selectedMessage.visibility}
            </span>
            {updatedLabel && (
              <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-xs text-white/60">
                Updated {updatedLabel}
              </span>
            )}
          </div>

          <div className={`rounded-xl border-2 p-5 ${previewTheme.card}`}>
            <div className="flex items-start gap-3">
              <span
                className={`mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${previewTheme.icon}`}
              >
                <PreviewIcon className="h-4 w-4" />
              </span>
              <div className="min-w-0 space-y-1.5">
                {selectedMessage.title && <p className="text-base font-semibold text-white/90">{selectedMessage.title}</p>}
                <p className="whitespace-pre-wrap text-sm leading-6 text-white/80">
                  {selectedMessage.message || 'Your message preview appears here.'}
                </p>
                {selectedMessage.reference && (
                  <p className={`text-xs font-medium tracking-wide ${previewTheme.reference}`}>
                    {selectedMessage.reference}
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="relative border-white/20 bg-black/80 backdrop-blur-xl">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Message Configuration</CardTitle>
              <CardDescription>Editing {selectedMessage.title.trim() || 'selected message'}.</CardDescription>
            </div>
            {canManageMessages && (
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={saving || !isDirty || hasAnyInvalidSchedule || !selectedHasMessageText}
                className={`
                  p-2 rounded-md border bg-muted/20 transition
                  focus:outline-none focus:ring-2 focus:ring-primary
                  ${(saving || !isDirty || hasAnyInvalidSchedule || !selectedHasMessageText)
                    ? 'opacity-40 cursor-not-allowed'
                    : 'hover:bg-muted'}
                `}
                aria-label="Save message settings"
              >
                {saving ? (
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                ) : showCheck ? (
                  <Check className="h-5 w-5 animate-pulse text-white" />
                ) : (
                  <Check className="h-5 w-5 text-white" />
                )}
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="flex min-h-[112px] flex-col justify-between rounded-lg border border-white/10 bg-black/35 p-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">Publish Message</p>
                <p className="text-xs text-white/65">Control if this appears for users.</p>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => updateMessage(selectedMessage.id, { enabled: false })}
                  disabled={!canManageMessages}
                  className={`flex-1 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${!selectedMessage.enabled ? 'border-white/30 bg-white/15 text-white' : 'border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80'} disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  Hidden
                </button>
                <button
                  type="button"
                  onClick={() => updateMessage(selectedMessage.id, { enabled: true })}
                  disabled={!canManageMessages}
                  className={`flex-1 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${selectedMessage.enabled ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300' : 'border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80'} disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  Published
                </button>
              </div>
            </div>

            <div className="flex min-h-[112px] flex-col justify-between rounded-lg border border-white/10 bg-black/35 p-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">Message Type</p>
                <p className="text-xs text-white/65">Choose quote, verse, or reminder.</p>
              </div>
              <Select
                value={selectedMessage.type}
                onValueChange={(value) => updateMessage(selectedMessage.id, { type: value as MessageType })}
                disabled={!canManageMessages}
              >
                <SelectTrigger className="mt-2 border-white/20 bg-black/40">
                  <SelectValue placeholder="Choose type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alert">Alert</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="quote">Quote</SelectItem>
                  <SelectItem value="reminder">Reminder</SelectItem>
                  <SelectItem value="verse">Scripture</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex min-h-[112px] flex-col justify-between rounded-lg border border-white/10 bg-black/35 p-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">Visibility</p>
                <p className="text-xs text-white/65">Set who can view this message.</p>
              </div>
              <Select
                value={selectedMessage.visibility}
                onValueChange={(value) => updateMessage(selectedMessage.id, { visibility: value as Visibility })}
                disabled={!canManageMessages}
              >
                <SelectTrigger className="mt-2 border-white/20 bg-black/40">
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

          <div className="space-y-4 rounded-lg border border-white/10 bg-black/25 p-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <p className="text-sm font-medium">Title (optional)</p>
                <Input
                  value={selectedMessage.title}
                  onChange={(e) => updateMessage(selectedMessage.id, { title: e.target.value })}
                  placeholder="Ex: Verse of the Week"
                  className="border-white/20 bg-black/40"
                  disabled={!canManageMessages}
                />
              </div>

              <div className="space-y-1.5">
                <p className="text-sm font-medium">Reference (optional)</p>
                <Input
                  value={selectedMessage.reference}
                  onChange={(e) => updateMessage(selectedMessage.id, { reference: e.target.value })}
                  placeholder="Ex: Proverbs 3:5-6"
                  className="border-white/20 bg-black/40"
                  disabled={!canManageMessages}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="text-sm font-medium">Message</p>
              <Textarea
                value={selectedMessage.message}
                onChange={(e) => updateMessage(selectedMessage.id, { message: e.target.value })}
                rows={8}
                maxLength={800}
                placeholder="Enter your church quote, verse, or reminder."
                className="border-white/20 bg-black/40"
                disabled={!canManageMessages}
              />
              <div className="flex items-center justify-between text-xs text-white/55">
                <span>
                  {selectedHasContent
                    ? 'Looks good. Keep messages concise for mobile readability.'
                    : 'Add content to preview your dashboard message.'}
                </span>
                <span>{selectedMessage.message.length}/800</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-black/25 p-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <p className="text-sm font-medium">Start Date (optional)</p>
                <Input
                  type="datetime-local"
                  value={selectedMessage.startAt}
                  onChange={(e) => updateMessage(selectedMessage.id, { startAt: e.target.value })}
                  className="border-white/20 bg-black/40"
                  disabled={!canManageMessages}
                />
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-medium">End Date (optional)</p>
                <Input
                  type="datetime-local"
                  value={selectedMessage.endAt}
                  onChange={(e) => updateMessage(selectedMessage.id, { endAt: e.target.value })}
                  className="border-white/20 bg-black/40"
                  disabled={!canManageMessages}
                />
              </div>
            </div>
          </div>

          {hasAnyInvalidSchedule && (
            <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200">
              One or more messages have an end date before the start date.
            </div>
          )}
        </CardContent>
      </Card>

    </>
  );
}
