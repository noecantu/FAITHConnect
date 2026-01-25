import { useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormControl,
} from "@/components/ui/form";

type SectionEditorProps = {
    index: number;
    members: { id: string; firstName: string; lastName: string }[];
    songs: { id: string; title: string }[];
    remove: () => void;
  };
  
  export function SectionEditor({
    index,
    members,
    songs,
    remove,
  }: SectionEditorProps) {
  const { control } = useFormContext();

  return (
    <div className="border rounded-md p-4 space-y-4 bg-muted/30">

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

              {/* Add Song Button */}
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

              {/* Song Rows or Empty State */}
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
                    variant="ghost"
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

      {/* Remove Section */}
      <div className="flex justify-end">
        <Button variant="destructive" size="sm" type="button" onClick={remove}>
          Delete Section
        </Button>
      </div>
    </div>
  );
}
