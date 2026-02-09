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

const normalize = (str: string) =>
  str.replace(/\s+/g, "").toLowerCase();

const sectionBgColors: Record<string, string> = {
  praise: "rgba(59, 130, 246, 0.05)",      // Blue
  worship: "rgba(251, 146, 60, 0.05)",     // Orange
  offering: "rgba(239, 68, 68, 0.05)",     // Red
  altarcall: "rgba(34, 197, 94, 0.05)",    // Green
  custom: "rgba(234, 179, 8, 0.05)",       // Yellow
};

type SectionEditorProps = {
  index: number;
  members: { id: string; firstName: string; lastName: string }[];
  songs: { id: string; title: string }[];
  remove: () => void;

  // NEW props
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
  const { control } = useFormContext();

  return (
    <div
      className="border rounded-md p-4 space-y-4"
      style={{
        backgroundColor:
          sectionBgColors[
            normalize(
              (control._formValues?.sections?.[index]?.title ?? "")
            )
          ] ?? "transparent",
      }}
    >

      {/* Header Row: Move Up / Down / Delete */}
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

      {/* Section Title */}
      <FormField
        control={control}
        name={`sections.${index}.title`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Section Title</FormLabel>
            <FormControl>
              <Input placeholder="MC, Worship, Preaching…" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

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

              {!field.value?.includes("") && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => field.onChange([...(field.value ?? []), ""])}
                >
                  Add Song
                </Button>
              )}

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
