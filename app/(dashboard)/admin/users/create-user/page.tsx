import { adminDb } from "@/app/lib/supabase/admin";
import CreateUserClient from "./CreateUserClient";

export const dynamic = "force-dynamic";

type ChurchOption = {
  id: string;
  name: string;
};

export default async function CreateUserPage() {
  const { data: churches } = await adminDb
    .from("churches")
    .select("id, name")
    .order("name", { ascending: true });

  const churchOptions: ChurchOption[] = (churches ?? []).map((c) => ({
    id: c.id,
    name: c.name ?? c.id,
  }));

  return <CreateUserClient churches={churchOptions} />;
}
