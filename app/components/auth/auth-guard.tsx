'use client';

import { useAuth } from '../../hooks/useAuth';
import { useChurchId } from '../../hooks/useChurchId';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

const PUBLIC_ROUTES = ['/login'];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { churchId, loading: churchLoading } = useChurchId();

  const router = useRouter();
  const pathname = usePathname();

  const hasRedirected = useRef(false);
  const [redirecting, setRedirecting] = useState(false);

  const isPublic = PUBLIC_ROUTES.includes(pathname);

  useEffect(() => {
    // Wait for BOTH auth + church context to finish loading
    if (authLoading || churchLoading) return;
    if (hasRedirected.current) return;

    // 1. Not logged in → protected route
    if (!user && !isPublic) {
      hasRedirected.current = true;
      setRedirecting(true);
      router.replace('/login');
      return;
    }

    // 2. Logged in → login page
    if (user && isPublic) {
      hasRedirected.current = true;
      setRedirecting(true);
      router.replace('/');
      return;
    }

    // 3. Logged in but no churchId → block protected pages
    if (user && !churchId && !isPublic) {
      hasRedirected.current = true;
      setRedirecting(true);
      router.replace('/select-church'); // or wherever you want
      return;
    }
  }, [
    user,
    churchId,
    authLoading,
    churchLoading,
    isPublic,
    router,
    pathname,
  ]);

  // Unified loading gate
  if (authLoading || churchLoading || redirecting) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin" />
      </div>
    );
  }

  // Public route allowed when logged out
  if (!user && isPublic) {
    return <>{children}</>;
  }

  // Protected route allowed when logged in AND churchId is ready
  if (user && churchId && !isPublic) {
    return <>{children}</>;
  }

  return null;
}
