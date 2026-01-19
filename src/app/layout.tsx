import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import { AuthGuard } from '@/components/auth/auth-guard';
import { ConditionalLayout } from './conditional-layout';
import { SettingsProvider } from '@/components/settings-provider';
import { AppFooter } from '@/components/layout/AppFooter';

export const metadata: Metadata = {
  title: 'FAITH Connect',
  description: 'Church member management application.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>

      <body className={cn('min-h-screen bg-background font-body antialiased flex flex-col')}>
        <AuthGuard>
          <SettingsProvider>
            <ConditionalLayout>{children}</ConditionalLayout>
          </SettingsProvider>
        </AuthGuard>

        <AppFooter />
        <Toaster />
      </body>
    </html>
  );
}
