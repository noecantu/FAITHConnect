'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { useState, useEffect, useCallback } from 'react';
import { Plus, Loader2, Trash2 } from 'lucide-react';

interface SectionName {
  id: string;
  title: string;
}

interface SectionNameDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSelect: (title: string | null) => void;
  currentTitle?: string | null;
  church_id?: string;
  churchId?: string;
}

export default function SectionNameDialog({
  isOpen,
  onOpenChange,
  onSelect,
  currentTitle,
  church_id,
  churchId,
}: SectionNameDialogProps) {
  const resolvedChurchId = church_id ?? churchId ?? "";
  const [items, setItems] = useState<SectionName[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchItems = useCallback(async () => {
    if (!resolvedChurchId) return;
    setIsLoading(true);

    try {
      const res = await fetch(`/api/section-names?churchId=${encodeURIComponent(resolvedChurchId)}`, {
        credentials: 'include',
      });
      const body = await res.json().catch(() => ({}));
      const data = Array.isArray(body?.items) ? body.items : [];

      const fetched = (data ?? []).map((d: { id: string; title: string }) => ({
        id: d.id,
        title: d.title,
      }));

      setItems(
        fetched.sort((a, b) => a.title.localeCompare(b.title))
      );
    } catch (err) {
      console.error("Error fetching section names:", err);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
    }, [resolvedChurchId, currentTitle]);

  useEffect(() => {
    if (isOpen) fetchItems();
  }, [isOpen, fetchItems]);

  const handleAdd = async (value?: string, autoSelect = false) => {
    const title = (value || newTitle).trim();
    if (!resolvedChurchId || title === '' || items.some(i => i.title.toLowerCase() === title.toLowerCase())) {
      return;
    }

    try {
      const res = await fetch('/api/section-names', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          churchId: resolvedChurchId,
          title,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const message =
          typeof body?.error === 'string' && body.error.length > 0
            ? body.error
            : 'Failed to add section name';
        throw new Error(message);
      }

      const body = await res.json().catch(() => ({}));
      const addedTitle =
        typeof body?.item?.title === 'string' && body.item.title.trim().length > 0
          ? body.item.title.trim()
          : title;
      const addedId =
        typeof body?.item?.id === 'string' && body.item.id.length > 0
          ? body.item.id
          : `local:${addedTitle.toLowerCase()}`;

      // Keep the list responsive even when section_names table is unavailable.
      setItems((prev) => {
        if (prev.some((item) => item.title.toLowerCase() === addedTitle.toLowerCase())) {
          return prev;
        }

        return [...prev, { id: addedId, title: addedTitle }].sort((a, b) =>
          a.title.localeCompare(b.title)
        );
      });

      if (autoSelect) {
        onSelect(addedTitle);
        onOpenChange(false);
        return;
      }

      setNewTitle('');
    } catch (err) {
      console.error("Error adding section name:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!resolvedChurchId) return;

    try {
      const res = await fetch('/api/section-names', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ churchId: resolvedChurchId, id }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const message =
          typeof body?.error === 'string' && body.error.length > 0
            ? body.error
            : 'Failed to delete section name';
        throw new Error(message);
      }
      await fetchItems();
    } catch (err) {
      console.error("Error deleting section name:", err);
    }
  };

  const handleSelect = (title: string) => {
    onSelect(title);
    onOpenChange(false);
  };

  const filtered = items.filter(i =>
    i.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Select Section Name</DialogTitle>
          <DialogDescription>
            Search or add a new section name.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col space-y-4">
          <Input
            placeholder="Search section names..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <div className="max-h-60 overflow-y-auto border rounded-md p-2">
            {isLoading ? (
              <div className="flex justify-center items-center p-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : filtered.length > 0 ? (
              filtered.map(i => (
                <div key={i.id} className="group flex items-center justify-between p-2 rounded-md hover:bg-muted text-sm">
                  <span onClick={() => handleSelect(i.title)} className="flex-grow cursor-pointer">
                    {i.title}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 invisible group-hover:visible"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(i.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center p-2">
                No section names found. Add one below.
              </p>
            )}
          </div>

          <div className="flex space-x-2">
            <Input
              placeholder="Add new section name"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAdd();
                }
              }}
            />
            <Button variant="outline" onClick={() => handleAdd()}>
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="default"
              onClick={() => {
                onSelect(null);
                onOpenChange(false);
              }}
            >
              Clear
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
