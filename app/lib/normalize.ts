import { Timestamp } from "firebase-admin/firestore";

export function normalizeFirestore(obj: any): any {
  if (obj === null || obj === undefined) return obj;

  // Convert Firestore Timestamp → ISO string
  if (obj instanceof Timestamp) {
    return obj.toDate().toISOString();
  }

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
