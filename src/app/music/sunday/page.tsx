'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useChurchId } from '@/hooks/useChurchId';
import { useSongs } from '@/hooks/useSongs';
import { useRecentSetLists } from '@/hooks/useRecentSetLists';
import { createSetList } from '@/lib/setlists';
import { SetListSongEditor } from '@/components/music/SetListSongEditor';
import { getSuggestedSongs } from '@/lib/songSuggestions';
import { SERVICE_TEMPLATES, ServiceTemplateId } from '@/lib/serviceTemplates';
import { exportServiceToPdf } from '@/lib/exportServicePdf';
import { exportServiceToExcel } from '@/lib/exportServiceExcel';
import type { SetList, SetListSection, SetListSongEntry } from '@/lib/types';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';
import { SetListSectionEditor } from '@/components/music/SetListSectionEditor';

export default function SundayServicePage() {
  const churchId = useChurchId();
  const router = useRouter();

  const { songs: allSongs, loading: songsLoading } = useSongs(churchId);
  const { lists: recentSetLists } = useRecentSetLists(churchId);

  // Step 0 — Template
  const [templateId, setTemplateId] = useState<ServiceTemplateId>('default');

  // Step 1 — Date + Title
  const nextSunday = dayjs().day(0).add(1, 'week');
  const [date, setDate] = useState(nextSunday.format('YYYY-MM-DD'));
  const [title, setTitle] = useState(
    `Sunday Service – ${nextSunday.format('MMM D, YYYY')}`
  );

  // Step 2 — Songs
  const [sections, setSections] = useState<SetListSection[]>([]);
  
  // Step 3 — Notes
  const [notes, setNotes] = useState({
    theme: '',
    scripture: '',
    notes: '',
  });

  // Suggestions
  const suggestedSongs = getSuggestedSongs(recentSetLists, allSongs);

  // 🚨 FIX: Now we can safely check churchId
  if (!churchId) {
    return (
      <>
        <PageHeader title="Plan Sunday Service" />
        <p className="text-muted-foreground">Loading…</p>
      </>
    );
  }

  // Create service
  const handleCreate = async () => {
    const newSetList: Omit<SetList, 'id' | 'createdAt' | 'updatedAt'> = {
      churchId,
      title,
      date: new Date(date),
      createdBy: 'system',
      serviceNotes: notes,
      sections
    };

    const created = await createSetList(churchId, newSetList);
    router.push(`/music/setlists/${created.id}`);
  };

  // PDF export
  const handleExportPdf = () => {
    const tempSetList: SetList = {
      id: 'temp',
      churchId,
      title,
      date: new Date(date),
      createdBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
      serviceNotes: notes,
      sections
    };

    exportServiceToPdf(tempSetList, allSongs);
  };

  // Excel export
  const handleExportExcel = () => {
    const tempSetList: SetList = {
      id: 'temp',
      churchId,
      title,
      date: new Date(date),
      createdBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
      serviceNotes: notes,
      sections
    };

    exportServiceToExcel(tempSetList, allSongs);
  };

  return (
    <>
      <PageHeader title="Plan Sunday Service" />

      <div className="space-y-6">

        {/* Template */}
        <Card className="p-4">
          <h2 className="font-semibold mb-2">Template</h2>

          <select
            className="border rounded px-2 py-1"
            value={templateId}
            onChange={(e) => {
              const id = e.target.value as ServiceTemplateId;
              setTemplateId(id);

              const template = SERVICE_TEMPLATES.find((t) => t.id === id);
              if (template?.notes) {
                setNotes((prev) => ({
                  ...prev,
                  ...template.notes,
                }));
              }
            }}
          >
            {SERVICE_TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </Card>

        {/* Step 1 — Date */}
        <Card className="p-4">
          <h2 className="font-semibold mb-2">1. Choose Service Date</h2>

          <div>
            <label className="block text-sm font-medium mb-1">Date</label>

            <Input
              type="date"
              value={date || ""}
              onChange={(e) => {
                const iso = e.target.value;
                setDate(iso);

                if (iso) {
                  setTitle(`Sunday Service – ${dayjs(iso).format("MMM D, YYYY")}`);
                }
              }}
            />
          </div>
        </Card>

        {/* Step 2 — Build Set List */}
        <Card className="p-4">
          <h2 className="font-semibold mb-2">2. Build Set List</h2>

          {/* Suggested Songs */}
          {suggestedSongs.length > 0 && (
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Suggested Songs</h3>
              <div className="flex flex-wrap gap-2">
                {suggestedSongs.map((song) => (
                  <Button
                    key={song.id}
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setSections((prev) => {
                        if (prev.length === 0) {
                          return [
                            {
                              id: crypto.randomUUID(),
                              name: "Worship",
                              songs: [
                                {
                                  songId: song.id,
                                  title: song.title,
                                  key: song.key,
                                  notes: "",
                                },
                              ],
                            },
                          ];
                        }

                        const updated = [...prev];
                        updated[0].songs.push({
                          songId: song.id,
                          title: song.title,
                          key: song.key,
                          notes: "",
                        });
                        return updated;
                      })
                    }
                  >
                    {song.title}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {songsLoading ? (
            <p className="text-muted-foreground">Loading songs…</p>
          ) : (
            <SetListSectionEditor
              sections={sections}
              onChange={setSections}
              allSongs={allSongs}
            />
          )}
        </Card>

        {/* Step 3 — Notes */}
        <Card className="p-4">
          <h2 className="font-semibold mb-2">3. Service Notes</h2>

          <Input
            placeholder="Theme"
            value={notes.theme}
            onChange={(e) => setNotes({ ...notes, theme: e.target.value })}
            className="mb-2"
          />

          <Input
            placeholder="Scripture"
            value={notes.scripture}
            onChange={(e) => setNotes({ ...notes, scripture: e.target.value })}
            className="mb-2"
          />

          <Input
            placeholder="Notes"
            value={notes.notes}
            onChange={(e) => setNotes({ ...notes, notes: e.target.value })}
          />
        </Card>

        {/* Step 4 — Finalize */}
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleCreate}>Create Sunday Service</Button>
          <Button variant="outline" onClick={handleExportPdf}>
            Export Preview PDF
          </Button>
          <Button variant="outline" onClick={handleExportExcel}>
            Export Excel
          </Button>
        </div>
      </div>
    </>
  );
}
