export function formatPhone(num?: string): string {
    if (!num) return "—";
  
    const digits = num.replace(/\D/g, "");
  
    if (digits.length !== 10) return num;
  
    const area = digits.slice(0, 3);
    const prefix = digits.slice(3, 6);
    const line = digits.slice(6);
  
    return `(${area}) ${prefix}-${line}`;
  }
  