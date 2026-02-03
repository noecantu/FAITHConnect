'use client';

import { use } from "react";
import SongViewOnly from "@/app/components/music/SongViewOnly";

export default function SongViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return <SongViewOnly songId={id} />;
}
