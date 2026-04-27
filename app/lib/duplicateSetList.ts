import { createSetList, getSetListById } from "@/app/lib/setlists";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;

  if (error && typeof error === "object") {
    const maybe = error as Record<string, unknown>;
    const parts = [maybe.message, maybe.code, maybe.details]
      .filter((part): part is string => typeof part === "string" && part.trim().length > 0);
    if (parts.length > 0) return parts.join(" | ");
  }

  return "Unknown duplication error";
}

export async function duplicateSetList(
  churchId: string,
  setListId: string,
  router: { push: (path: string) => void }
) {
  try {
    const original = await getSetListById(churchId, setListId);
    if (!original) {
      throw new Error("Set list not found");
    }

    const created = await createSetList(churchId, {
      title: `${original.title}_Copy`,
      dateString: original.dateString,
      timeString: original.timeString,
      sections: original.sections,
      serviceType: original.serviceType ?? null,
      serviceNotes: original.serviceNotes ?? null,
    });

    router.push(`/church/${churchId}/music/setlists/${created.id}`);
  } catch (err) {
    console.error("Duplicate error:", getErrorMessage(err));
  }
}
