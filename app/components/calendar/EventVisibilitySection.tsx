import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { MultiSelect } from "../ui/multi-select";
import { EVENT_GROUP_OPTIONS } from "@/app/lib/eventGroups";
import type { UseFormReturn } from "react-hook-form";
import type { EventFormValues } from "@/app/components/calendar/EventFormDialog";

interface EventVisibilitySectionProps {
  form: UseFormReturn<EventFormValues>;
  isAdmin: boolean;
  isManager: boolean;
  managerGroup: string | null;
}

function SegmentedControl({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
}) {
  return (
    <div className="flex rounded-md overflow-hidden border border-white/10 bg-black/40">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={
              "flex-1 px-3 py-2 text-sm font-medium transition-colors " +
              (active
                ? "bg-slate-600 text-white"
                : "text-white/60 hover:bg-white/10")
            }
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function EventVisibilitySection({
  form,
  isAdmin,
  isManager,
  managerGroup,
}: EventVisibilitySectionProps) {
  const isPublic = form.watch("isPublic");

  return (
    <>
      {/* VISIBILITY SECTION — ADMIN ONLY */}
      {isAdmin && (
        <div className="space-y-4 border-t border-white/20 pt-6 mt-6">
          <h3 className="text-lg font-semibold">Visibility</h3>

          {/* PUBLIC / PRIVATE TOGGLE */}
          <FormField
            control={form.control}
            name="isPublic"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-white/60">
                  Who should be able to see the event?
                </FormLabel>

                <FormControl>
                  <SegmentedControl
                    value={field.value ? "public" : "private"}
                    onChange={(v) => {
                      const isPublic = v === "public";
                      field.onChange(isPublic);

                      // Reset groups when switching to public
                      if (isPublic) form.setValue("groups", []);
                    }}
                    options={[
                      { label: "Public", value: "public" },
                      { label: "Private", value: "private" },
                    ]}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {/* GROUP SELECTOR — ONLY WHEN PRIVATE */}
          {!isPublic && (
            <FormField
              control={form.control}
              name="groups"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Visible to Groups</FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={EVENT_GROUP_OPTIONS}
                      value={field.value ?? []}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>
      )}

      {/* MANAGER VIEW */}
      {isManager && (
        <div className="space-y-2 border-t border-white/10 pt-4 mt-4">
          <FormLabel>Group</FormLabel>
          <div className="text-sm text-white/70">{managerGroup}</div>
        </div>
      )}
    </>
  );
}
