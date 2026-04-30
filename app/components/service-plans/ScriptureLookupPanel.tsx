"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import {
  getScriptureTranslations,
  lookupScripture,
  type ScriptureTranslationOption,
} from "@/app/lib/scriptureLookup";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";

type Props = {
  scripture: string;
  scriptureTranslation: string;
  scriptureText: string;
  onScriptureChange: (value: string) => void;
  onScriptureTranslationChange: (value: string) => void;
  onScriptureTextChange: (value: string) => void;
};

export function ScriptureLookupPanel({
  scripture,
  scriptureTranslation,
  scriptureText,
  onScriptureChange,
  onScriptureTranslationChange,
  onScriptureTextChange,
}: Props) {
  const [lookupReference, setLookupReference] = useState(scripture);
  const [lookupTranslation, setLookupTranslation] = useState(scriptureTranslation || "kjv");
  const [loading, setLoading] = useState(false);
  const [translationsLoading, setTranslationsLoading] = useState(true);
  const [translations, setTranslations] = useState<ScriptureTranslationOption[]>([]);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupSource, setLookupSource] = useState<"live" | "cache" | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadTranslations = async () => {
      setTranslationsLoading(true);
      try {
        const options = await getScriptureTranslations();
        if (!mounted) return;

        setTranslations(options);

        const current = (scriptureTranslation || "").trim().toLowerCase();
        const hasCurrent = options.some((opt) => opt.id === current);
        const defaultTranslation = options.some((opt) => opt.id === "kjv")
          ? "kjv"
          : options[0]?.id ?? "kjv";

        if (!current || !hasCurrent) {
          setLookupTranslation(defaultTranslation);
          onScriptureTranslationChange(defaultTranslation);
        }
      } catch (error) {
        if (!mounted) return;
        setLookupError(error instanceof Error ? error.message : "Failed to load translations");
        setTranslations([{ id: "kjv", name: "King James Version", language: "English" }]);
        if (!scriptureTranslation.trim()) {
          setLookupTranslation("kjv");
          onScriptureTranslationChange("kjv");
        }
      } finally {
        if (mounted) {
          setTranslationsLoading(false);
        }
      }
    };

    void loadTranslations();

    return () => {
      mounted = false;
    };
  }, [onScriptureTranslationChange, scriptureTranslation]);

  useEffect(() => {
    setLookupReference(scripture);
  }, [scripture]);

  useEffect(() => {
    if (!scriptureTranslation.trim()) return;
    setLookupTranslation(scriptureTranslation);
  }, [scriptureTranslation]);

  const translationOptions = translations.length > 0
    ? translations
    : [{ id: "kjv", name: "King James Version", language: "English" }];

  const groupedTranslations = translationOptions.reduce<Record<string, ScriptureTranslationOption[]>>(
    (acc, t) => {
      const lang = t.language || "Other";
      (acc[lang] ??= []).push(t);
      return acc;
    },
    {}
  );
  const sortedLanguages = Object.keys(groupedTranslations).sort((a, b) =>
    a === "English" ? -1 : b === "English" ? 1 : a.localeCompare(b)
  );

  const handleLookup = async () => {
    const reference = lookupReference.trim();
    const translation = lookupTranslation.trim() || "kjv";

    if (!reference) {
      setLookupError("Enter a scripture reference first.");
      return;
    }

    setLoading(true);
    setLookupError(null);
    setLookupSource(null);

    try {
      const result = await lookupScripture(reference, translation);
      onScriptureChange(result.reference);
      onScriptureTranslationChange(result.translation);
      onScriptureTextChange(result.verseText);
      setLookupReference(result.reference);
      setLookupTranslation(result.translation);
      setLookupSource(result.source);
    } catch (error) {
      setLookupError(error instanceof Error ? error.message : "Lookup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3 rounded-lg border border-white/15 bg-black/30 p-4">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,16rem)_auto]">
        <Input
          value={lookupReference}
          onChange={(e) => {
            setLookupReference(e.target.value);
            onScriptureChange(e.target.value);
          }}
          placeholder="Search reference (John 3:16)"
        />
        <Select
          value={lookupTranslation}
          onValueChange={(value) => {
            setLookupTranslation(value);
            onScriptureTranslationChange(value);
          }}
          disabled={translationsLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select translation" />
          </SelectTrigger>
          <SelectContent>
            {sortedLanguages.map((lang) => (
              <SelectGroup key={lang}>
                <SelectLabel>{lang}</SelectLabel>
                {groupedTranslations[lang].map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.id.toUpperCase()} — {option.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
        <Button type="button" variant="outline" onClick={handleLookup} disabled={loading}>
          <Search className="h-4 w-4" />
          {loading ? "Looking up..." : "Lookup"}
        </Button>
      </div>

      {(lookupError || lookupSource) && (
        <p className={`text-xs ${lookupError ? "text-destructive" : "text-white/60"}`}>
          {lookupError ? lookupError : `Loaded from ${lookupSource}.`}
        </p>
      )}

      <div className="space-y-2">
        <p className="text-sm font-medium">Verse Text</p>
        <Textarea
          rows={4}
          value={scriptureText}
          onChange={(e) => onScriptureTextChange(e.target.value)}
          placeholder="Verse text will auto-fill after lookup"
        />
      </div>
    </div>
  );
}
