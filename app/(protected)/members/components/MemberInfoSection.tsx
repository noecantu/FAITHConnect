'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "../../../components/ui/form";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import type { UseFormReturn } from "react-hook-form";
import type { MemberFormValues } from "../../../lib/memberForm.schema";
import { formatPhone } from '../../../lib/formatters';

type Props = {
  form: UseFormReturn<MemberFormValues>;
};

function formatPhoneInput(digits: string): string {
  const cleaned = digits.replace(/\D/g, "").slice(0, 10);

  if (cleaned.length <= 3) {
    return cleaned;
  }

  if (cleaned.length <= 6) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
  }

  return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
}

function calculateCursorPosition(prev: string, next: string, cursor: number) {
  const prevDigitsBeforeCursor = prev.slice(0, cursor).replace(/\D/g, "").length;

  let newCursor = next.length;
  let digitCount = 0;

  for (let i = 0; i < next.length; i++) {
    if (/\d/.test(next[i])) digitCount++;
    if (digitCount === prevDigitsBeforeCursor) {
      newCursor = i + 1;
      break;
    }
  }

  return newCursor;
}

export function MemberInfoSection({ form }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Member Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                First Name <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="lastName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Last Name <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Phone <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  value={formatPhoneInput(field.value ?? "")}
                  onChange={(e) => {
                    const input = e.target;
                    const raw = input.value;
                    const cursor = input.selectionStart ?? raw.length;

                    // 1. Extract raw digits (what we actually store)
                    const digits = raw.replace(/\D/g, "").slice(0, 10);

                    // 2. Build the formatted view value
                    const formatted = formatPhoneInput(digits);

                    // 3. Compute new cursor position
                    const nextCursor = calculateCursorPosition(raw, formatted, cursor);

                    // 4. Store RAW digits in the form
                    field.onChange(digits);

                    // 5. Restore cursor after React applies value
                    requestAnimationFrame(() => {
                      input.setSelectionRange(nextCursor, nextCursor);
                    });
                  }}
                  inputMode="numeric"
                  placeholder="(915) 123‑4567"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="birthday"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Birthday</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  value={field.value || ""}
                  onChange={(e) => field.onChange(e.target.value)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="baptismDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Baptism Date</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  value={field.value || ""}
                  onChange={(e) => field.onChange(e.target.value)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address.street"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Street</FormLabel>
              <FormControl>
                <Input {...field} placeholder="123 Main St" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="address.city"
            render={({ field }) => (
              <FormItem className="md:col-span-1">
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="address.state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>State</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="address.zip"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Zip</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
