'use client';

import { useAuth } from '../../hooks/useAuth';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

// List of routes that are publicly accessible without authentication
const PUBLIC_ROUTES = ['/login'];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // If the auth state is still loading, don't do anything yet.
    if (loading) return;

    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

    // If the user is not authenticated and is trying to access a protected route,
    // redirect them to the login page.
    if (!user && !isPublicRoute) {
      router.push('/login');
    }

    // If the user is authenticated and is trying to access the login page,
    // redirect them to the home page.
    if (user && isPublicRoute) {
      router.push('/');
    }

  }, [user, loading, router, pathname]);

  // While the auth state is loading, show a full-screen loader
  // to prevent a flash of unauthenticated content.
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin" />
      </div>
    );
  }

  // If the user is not authenticated and on a public route (like /login), allow it.
  if (!user && PUBLIC_ROUTES.includes(pathname)) {
    return <>{children}</>;
  }

  // If the user is authenticated and not on a public route, show the protected content.
  if (user && !PUBLIC_ROUTES.includes(pathname)) {
      return <>{children}</>;
  }

  // In other cases (like redirecting), this will be null, which is fine.
  return null;
}
