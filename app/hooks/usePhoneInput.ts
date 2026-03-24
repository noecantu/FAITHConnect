import { useState, useCallback } from "react";
import { formatPhone } from '@/app/lib/formatters';

export function usePhoneInput(initial?: string) {
  const initialDigits = initial ? initial.replace(/\D/g, "").slice(0, 10) : "";

  const [digits, _setDigits] = useState(initialDigits);
  const [display, setDisplay] = useState(formatPhone(initialDigits));

  const setDigits = useCallback((value: string) => {
    const limited = value.replace(/\D/g, "").slice(0, 10);
    _setDigits(limited);
    setDisplay(formatPhone(limited));
  }, []);

  const handleChange = useCallback((value: string) => {
    const raw = value.replace(/\D/g, "");
    const limited = raw.slice(0, 10);
    const formatted = formatPhone(limited);

    _setDigits(limited);
    setDisplay(formatted);
  }, []);

  return {
    digits,
    display,
    handleChange,
    setDigits,
  };
}