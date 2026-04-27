// Setlist actions — re-exported from shared lib (Supabase-backed)
export {
  listenToSetLists as getSetlists,
  getSetListById as getSetlistById,
  createSetList as createSetlist,
  updateSetList as updateSetlist,
  deleteSetList as deleteSetlist,
} from "@/app/lib/setlists";

export { duplicateSetList as duplicateSetlist } from "@/app/lib/duplicateSetList";
