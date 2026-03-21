import { useState, useCallback } from "react";
import { formatPhone } from '@/app/lib/formatters';

export function usePhoneInput(initial?: string) {
  // Normalize initial value to digits only
  const initialDigits = initial ? initial.replace(/\D/g, "").slice(0, 10) : "";

  const [digits, setDigits] = useState(initialDigits);
  const [display, setDisplay] = useState(formatPhone(initialDigits));

  const handleChange = useCallback((value: string) => {
    // 1. Strip non-digits
    const raw = value.replace(/\D/g, "");

    // 2. Limit to 10 digits
    const limited = raw.slice(0, 10);

    // 3. Format for display
    const formatted = formatPhone(limited);

    // 4. Update state
    setDigits(limited);
    setDisplay(formatted);
  }, []);

  return {
    digits,        // raw "9151234567"
    display,       // formatted "(915) 123‑4567"
    handleChange,  // call this in onChange
    setDigits,     // optional: manual override
  };
}
