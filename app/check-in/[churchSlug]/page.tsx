import { db } from "@/app/lib/firebase";
import { query, collection, where, getDocs } from "firebase/firestore";
import SelfCheckIn from "./SelfCheckIn";

// -----------------------------
// TYPES
// -----------------------------
type FirestoreTimestamp = {
  seconds: number;
  nanoseconds: number;
};

type JSONValue =
  | string
  | number
  | boolean
  | null
  | JSONValue[]
  | { [key: string]: JSONValue };

export type Church = {
  id: string;
  name?: string;
  slug?: string;
} & Record<string, JSONValue>;

// -----------------------------
// TYPE GUARD
// -----------------------------
function isTimestamp(value: unknown): value is FirestoreTimestamp {
  return (
    typeof value === "object" &&
    value !== null &&
    "seconds" in value &&
    "nanoseconds" in value
  );
}

// -----------------------------
// NORMALIZER
// -----------------------------
function normalize(value: unknown): JSONValue {
  if (value === null || value === undefined) return null;

  // Firestore Timestamp → ISO string
  if (isTimestamp(value)) {
    return new Date(
      value.seconds * 1000 + value.nanoseconds / 1e6
    ).toISOString();
  }

  // Array
  if (Array.isArray(value)) {
    return value.map(normalize);
  }

  // Object
  if (typeof value === "object") {
    const result: { [key: string]: JSONValue } = {};
    for (const key of Object.keys(value)) {
      result[key] = normalize((value as Record<string, unknown>)[key]);
    }
    return result;
  }

  // Primitive
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  return null;
}

// -----------------------------
// PAGE COMPONENT
// -----------------------------
export default async function Page({
  params,
}: {
  params: Promise<{ churchSlug: string }>;
}) {
  const { churchSlug } = await params;

  // Fetch church by slug
  const q = query(
    collection(db, "churches"),
    where("slug", "==", churchSlug)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-200">
        Church not found.
      </div>
    );
  }

  const raw = snapshot.docs[0].data();

  // Normalize Firestore timestamps + nested objects
  const normalized = normalize(raw);

  // Build a strongly typed Church object
  const church: Church = {
    id: snapshot.docs[0].id,
    ...(normalized as Record<string, JSONValue>),
  };

  return <SelfCheckIn church={church} />;
}
