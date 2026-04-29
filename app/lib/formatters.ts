export function formatPhone(num?: string): string {
    if (!num) return "—";
  
    const digits = num.replace(/\D/g, "");
  
    if (digits.length !== 10) return num;
  
    const area = digits.slice(0, 3);
    const prefix = digits.slice(3, 6);
    const line = digits.slice(6);
  
    return `(${area}) ${prefix}-${line}`;
  }

const numberFormatter = new Intl.NumberFormat("en-US");

const usdCurrencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

export function formatCurrencyUSD(value: number): string {
  return usdCurrencyFormatter.format(value);
}
  