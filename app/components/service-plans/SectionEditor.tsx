import { useFormContext } from "react-hook-form";
import { useState } from "react";
import { Card } from "../ui/card";
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
import { Separator } from "../ui/separator";
import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormControl,
} from "../ui/form";
import { ChevronUp, ChevronDown, Trash2, Palette } from "lucide-react";
import SectionNameDialog from "@/app/components/music/SectionNameSelectionDialog";
import { getSectionColor, SECTION_COLOR_PALETTE } from "@/app/lib/sectionColors";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover";

type SectionEditorProps = {
  index: number;
  churchId: string;
  members: { id: string; firstName: string; lastName: string }[];
  remove: () => void;

  moveUp: () => void;
  moveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
};

export function SectionEditor({
  index,
  churchId,
  members,
  remove,
  moveUp,
  moveDown,
  isFirst,
  isLast,
}: SectionEditorProps) {
  const { control, watch, setValue } = useFormContext();
  const [nameDialogOpen, setNameDialogOpen] = useState(false);

  const title = watch(`sections.${index}.title`);
  const personId: string | null = watch(`sections.${index}.personId`);
  const personName: string = watch(`sections.${index}.personName`) ?? "";
  const sectionColorOverride: string | undefined = watch(`sections.${index}.color`);
  const sectionColor = sectionColorOverride ?? getSectionColor(title);

  return (
    <Card
      className="p-5 space-y-5 relative"
      style={{ backgroundColor: sectionColor }}
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
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 justify-start font-normal text-left"
                onClick={() => setNameDialogOpen(true)}
              >
                {field.value
                  ? field.value
                  : <span className="text-muted-foreground">Select section name…</span>}
              </Button>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      <SectionNameDialog
        isOpen={nameDialogOpen}
        onOpenChange={setNameDialogOpen}
        churchId={churchId}
        currentTitle={title}
        onSelect={(selected) => {
          if (selected !== null) setValue(`sections.${index}.title`, selected);
        }}
      />

      {/* Person */}
      <FormField
        control={control}
        name={`sections.${index}.personId`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Person</FormLabel>
            <Select
              value={field.value ?? undefined}
              onValueChange={(value) => {
                field.onChange(value);
              }}
            >
              <div className="flex items-center gap-2">
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a person" />
                  </SelectTrigger>
                </FormControl>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-10 w-14 shrink-0"
                  aria-label="Clear Person"
                  title="Clear"
                  onClick={() => {
                    field.onChange(null);
                    setValue(`sections.${index}.personName`, "");
                  }}
                  disabled={!personId && personName.trim().length === 0}
                >
                  Clear
                </Button>
              </div>
              <SelectContent>
                <div
                  className="px-2 py-2 space-y-2"
                  onPointerDownCapture={(e) => e.stopPropagation()}
                  onKeyDownCapture={(e) => e.stopPropagation()}
                >
                  <p className="text-xs text-muted-foreground">Custom entry</p>
                  <Input
                    placeholder="Type a custom name"
                    value={personName}
                    onChange={(e) => setValue(`sections.${index}.personName`, e.target.value)}
                  />
                </div>
                <Separator className="my-1" />
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
    </Card>
  );
}