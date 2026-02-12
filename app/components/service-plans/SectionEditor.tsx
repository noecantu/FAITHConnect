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
import { ChevronUp, ChevronDown, Trash2 } from "lucide-react";

import { SECTION_TEMPLATES } from "@/app/lib/sectionTemplates";
import { getSectionColor } from "@/app/lib/sectionColors";

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

  return (
    <div
      className="border rounded-md p-4 space-y-4"
      style={{ backgroundColor: getSectionColor(title) }}
    >
      {/* Header Row */}
      <div className="flex justify-between items-center mb-2">
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
          >
            <ChevronUp className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={isLast}
            onClick={moveDown}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={remove}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </div>

      {/* Section Title (Dropdown) */}
      <FormField
        control={control}
        name={`sections.${index}.title`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Section Title</FormLabel>

            <Select
              value={field.value}
              onValueChange={(value) => {
                setValue(`sections.${index}.title`, value);
              }}
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

            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => field.onChange([...(field.value ?? []), ""])}
              >
                Add Song
              </Button>

              {(field.value ?? []).map((songId: string, songIndex: number) => (
                <div key={songIndex} className="flex items-center gap-2">
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
              <Textarea placeholder="Optional notes…" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
