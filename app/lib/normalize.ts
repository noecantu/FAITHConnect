export function normalizeFirestore(obj: any): any {
  if (obj === null || obj === undefined) return obj;

  // Convert arrays
  if (Array.isArray(obj)) {
    return obj.map((item) => normalizeFirestore(item));
  }

  // Convert objects
  if (typeof obj === "object") {
    const out: any = {};
    for (const key in obj) {
      out[key] = normalizeFirestore(obj[key]);
    }
    return out;
  }

  return obj;
}
