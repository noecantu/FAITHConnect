// app/layout.tsx
"use client";

import { Inter } from "next/font/google";
import type { Metadata } from 'next';
import './globals.css';
import { cn } from './lib/utils';
import { Toaster } from './components/ui/toaster';
import { SettingsProvider } from './components/settings-provider';

export const metadata: Metadata = {
  title: 'FAITH Connect',
  description: 'Church member management application.',
};

// ❗ MUST be at module scope
const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("font-sans dark", inter.variable)} suppressHydrationWarning>
      <body
        className={cn(
          inter.variable,
          "min-h-screen bg-gradient-to-br from-black via-slate-900 to-black text-white font-sans antialiased"
        )}
      >
        <SettingsProvider>
          {children}
        </SettingsProvider>

        <Toaster />
      </body>
    </html>
  );
}
