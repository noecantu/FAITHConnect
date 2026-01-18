import { useState } from "react";

export function usePhoneInput(initial?: string) {
  const [value, setValue] = useState(format(initial));

  function format(input?: string) {
    if (!input) return "";

    const digits = input.replace(/\D/g, "").slice(0, 10);

    const len = digits.length;
    if (len < 4) return digits;
    if (len < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    setValue(format(raw));
  }

  function getRaw() {
    return value.replace(/\D/g, "");
  }

  return { value, onChange: handleChange, getRaw };
}