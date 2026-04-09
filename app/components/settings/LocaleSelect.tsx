"use client";

import { Label } from "@/app/components/ui/label";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export default function LocaleSelect({ value, onChange }: Props) {
  return (
    <div className="space-y-2">
      <Label>Default Locale</Label>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="
          w-full rounded-md border border-input bg-background
          px-3 py-2 text-sm
          h-10
          focus:outline-none focus:ring-2 focus:ring-primary
        "
      >
        <option value="">Select a locale</option>

        <optgroup label="English">
          <option value="en-US">English (United States)</option>
          <option value="en-GB">English (United Kingdom)</option>
          <option value="en-CA">English (Canada)</option>
          <option value="en-AU">English (Australia)</option>
        </optgroup>

        <optgroup label="Spanish">
          <option value="es-ES">Spanish (Spain)</option>
          <option value="es-MX">Spanish (Mexico)</option>
          <option value="es-US">Spanish (United States)</option>
        </optgroup>

        <optgroup label="French">
          <option value="fr-FR">French (France)</option>
          <option value="fr-CA">French (Canada)</option>
        </optgroup>

        <optgroup label="German">
          <option value="de-DE">German (Germany)</option>
        </optgroup>

        <optgroup label="Portuguese">
          <option value="pt-BR">Portuguese (Brazil)</option>
          <option value="pt-PT">Portuguese (Portugal)</option>
        </optgroup>

        <optgroup label="Asian">
          <option value="ja-JP">Japanese</option>
          <option value="zh-CN">Chinese (Simplified)</option>
          <option value="zh-TW">Chinese (Traditional)</option>
          <option value="ko-KR">Korean</option>
        </optgroup>
      </select>
    </div>
  );
}
