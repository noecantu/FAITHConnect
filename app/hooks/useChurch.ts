import { useState, useEffect } from 'react';

export function useChurch(churchId: string | undefined) {
  const [church, setChurch] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!churchId) {
      setLoading(false);
      return;
    }

    async function fetchChurch() {
      try {
        const res = await fetch(`/api/church/${encodeURIComponent(churchId!)}`);
        if (res.ok) {
          const data = await res.json();
          setChurch(data);
        }
      } catch (err) {
        console.error("Error fetching church:", err);
      }
      setLoading(false);
    }

    fetchChurch();
  }, [churchId]);

  return { church, loading };
}
