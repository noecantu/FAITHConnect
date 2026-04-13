//app/(dashboard)/admin/regional/church/[churchId]/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function RegionalChurchRedirectPage() {
  const router = useRouter();
  const { churchId } = useParams();

  useEffect(() => {
    if (churchId) {
      router.replace(`/admin/church/${churchId}`);
    }
  }, [churchId, router]);

  return null;
}