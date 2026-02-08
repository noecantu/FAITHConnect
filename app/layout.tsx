import type { Metadata } from 'next';
import './globals.css';
import { cn } from './lib/utils';
import { Toaster } from './components/ui/toaster';
import { AuthGuard } from './components/auth/auth-guard';
import { ConditionalLayout } from './conditional-layout';
import { SettingsProvider } from './components/settings-provider';
import { AppFooter } from './components/layout/AppFooter';
import { Inter } from "next/font/google";

export const metadata: Metadata = {
  title: 'FAITH Connect',
  description: 'Church member management application.',
};

// Initialize Inter and bind it to the CSS variable Tailwind expects
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={cn(
          inter.variable,                 // <-- registers the font variable
          "min-h-screen bg-background font-sans antialiased flex flex-col"
        )}
      >
        <SettingsProvider>
          <ConditionalLayout>{children}</ConditionalLayout>
        </SettingsProvider>

        <AppFooter />
        <Toaster />
      </body>
    </html>
  );
}
