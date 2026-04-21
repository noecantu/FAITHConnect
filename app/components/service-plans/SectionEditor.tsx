import { useFormContext } from "react-hook-form";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../ui/select";
import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormControl,
} from "../ui/form";
import { ChevronUp, ChevronDown, Trash2, Palette } from "lucide-react";

import { SECTION_TEMPLATES } from "@/app/lib/sectionTemplates";
import { getSectionColor, SECTION_COLOR_PALETTE } from "@/app/lib/sectionColors";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover";

const SECTION_TITLES = SECTION_TEMPLATES.map(t => t.title);

type SectionEditorProps = {
  index: number;
  members: { id: string; firstName: string; lastName: string }[];
  songs: { id: string; title: string }[];
  remove: () => void;

  moveUp: () => void;
  moveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
};

export function SectionEditor({
  index,
  members,
  songs,
  remove,
  moveUp,
  moveDown,
  isFirst,
  isLast,
}: SectionEditorProps) {
  const { control, watch, setValue } = useFormContext();

  const title = watch(`sections.${index}.title`);
  const sectionColorOverride: string | undefined = watch(`sections.${index}.color`);
  const sectionColor = sectionColorOverride ?? getSectionColor(title);

  return (
    <div
      className="rounded-md border border-border p-5 space-y-5 bg-card relative"
      style={{
        // Soft color tint instead of full background
        boxShadow: `0 0 0 3px ${sectionColor}33`,
      }}
    >
      {/* Header Row */}
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-muted-foreground">
          Section {index + 1}
        </span>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={isFirst}
            onClick={moveUp}
            className="h-7 w-7"
          >
            <ChevronUp className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={isLast}
            onClick={moveDown}
            className="h-7 w-7"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>

          {/* Color Picker */}
          <Popover>
            {(() => {
              const activeEntry = SECTION_COLOR_PALETTE.find(c => c.bg === sectionColorOverride);
              return (
                <PopoverTrigger
                  title="Set section color"
                  className="inline-flex items-center justify-center rounded-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  style={activeEntry
                    ? { border: `1.5px solid ${activeEntry.solid}`, boxShadow: `0 0 0 1px ${activeEntry.solid}`, height: '1.75rem', width: '1.75rem' }
                    : { background: 'linear-gradient(135deg,#8b5cf6,#3b82f6,#22c55e,#eab308,#ef4444)', padding: '1.5px', height: '1.75rem', width: '1.75rem' }
                  }
                >
                  <span className="flex items-center justify-center w-full h-full rounded-[calc(0.375rem-1px)] bg-background">
                    <Palette className="h-4 w-4" style={{ color: activeEntry?.solid }} />
                  </span>
                </PopoverTrigger>
              );
            })()}
            <PopoverContent className="w-auto p-2" align="end">
              <p className="text-xs text-muted-foreground mb-2">Section color</p>
              <div className="flex flex-wrap gap-1.5 max-w-[160px]">
                {SECTION_COLOR_PALETTE.map((c) => (
                  <button
                    key={c.label}
                    type="button"
                    title={c.label}
                    onClick={() => setValue(`sections.${index}.color`, c.bg)}
                    className="h-6 w-6 rounded-full border-2 transition-transform hover:scale-110"
                    style={{
                      backgroundColor: c.solid,
                      borderColor: sectionColorOverride === c.bg ? 'white' : 'transparent',
                    }}
                  />
                ))}
                {/* Reset to default */}
                <button
                  type="button"
                  title="Default (auto)"
                  onClick={() => setValue(`sections.${index}.color`, undefined)}
                  className="h-6 w-6 rounded-full border-2 border-white/30 bg-white/10 text-[10px] font-bold hover:bg-white/20 transition-colors"
                >
                  ×
                </button>
              </div>
            </PopoverContent>
          </Popover>

          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={remove}
            className="h-7 w-7"
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </div>

      {/* Section Title */}
      <FormField
        control={control}
        name={`sections.${index}.title`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Section Title</FormLabel>

            <Select
              value={field.value}
              onValueChange={(value) => setValue(`sections.${index}.title`, value)}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
              </FormControl>

              <SelectContent>
                {SECTION_TITLES.map((title) => (
                  <SelectItem key={title} value={title}>
                    {title}
                  </SelectItem>
                ))}
                <SelectItem value="__custom">Custom…</SelectItem>
              </SelectContent>
            </Select>

            <FormMessage />
          </FormItem>
        )}
      />

      {/* Custom Title Input */}
      {title === "__custom" && (
        <Input
          autoFocus
          placeholder="Custom section name"
          onChange={(e) =>
            setValue(`sections.${index}.title`, e.target.value)
          }
          className="font-medium"
        />
      )}

      {/* Person */}
      <FormField
        control={control}
        name={`sections.${index}.personId`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Person</FormLabel>
            <Select value={field.value ?? ""} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select a person" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.firstName} {m.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Songs */}
      <FormField
        control={control}
        name={`sections.${index}.songIds`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Songs</FormLabel>

            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => field.onChange([...(field.value ?? []), ""])}
              >
                Add Song
              </Button>

              {(field.value ?? []).map((songId: string, songIndex: number) => (
                <div
                  key={songIndex}
                  className="flex items-center gap-2 bg-muted/30 p-2 rounded-md"
                >
                  <Select
                    value={songId}
                    onValueChange={(val) => {
                      const updated = [...field.value];
                      updated[songIndex] = val;
                      field.onChange(updated);
                    }}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a song" />
                      </SelectTrigger>
                    </FormControl>

                    <SelectContent>
                      {songs.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const updated = [...field.value];
                      updated.splice(songIndex, 1);
                      field.onChange(updated);
                    }}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>

            <FormMessage />
          </FormItem>
        )}
      />

      {/* Notes */}
      <FormField
        control={control}
        name={`sections.${index}.notes`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Notes</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Optional notes…"
                {...field}
                className="min-h-[80px]"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}