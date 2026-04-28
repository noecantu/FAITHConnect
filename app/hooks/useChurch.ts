import { useState, useEffect } from 'react';
import type { Church } from '@/app/lib/types';

type RawChurch = Church & {
  billing_delinquent?: boolean | null;
  billing_status?: string | null;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  plan_id?: string | null;
  billing_owner_uid?: string | null;
};

function normalizeChurch(raw: RawChurch): Church {
  return {
    ...raw,
    logoUrl: raw.logoUrl ?? raw.logo_url ?? null,
    leaderName: raw.leaderName ?? raw.leader_name ?? null,
    leaderTitle: raw.leaderTitle ?? raw.leader_title ?? null,
    billingStatus: raw.billingStatus ?? raw.billing_status ?? null,
    billingDelinquent: raw.billingDelinquent ?? raw.billing_delinquent ?? false,
    stripeCustomerId: raw.stripeCustomerId ?? raw.stripe_customer_id ?? null,
    stripeSubscriptionId: raw.stripeSubscriptionId ?? raw.stripe_subscription_id ?? null,
    planId: raw.planId ?? raw.plan_id ?? null,
    billingOwnerUid: raw.billingOwnerUid ?? raw.billing_owner_uid ?? null,
  };
}

export function useChurch(churchId: string | null | undefined) {
  const [church, setChurch] = useState<Church | null>(null);
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
          const data = (await res.json()) as RawChurch;
          setChurch(normalizeChurch(data));
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
