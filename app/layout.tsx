// app/layout.tsx

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

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={cn("font-sans dark", inter.variable)}
      suppressHydrationWarning
    >
      <body
        className={cn(
          inter.variable,
          // 👇 The magic: full-height flex column
          "min-h-screen flex flex-col bg-gradient-to-br from-black via-slate-900 to-black text-white font-sans antialiased"
        )}
      >
        <SettingsProvider>
          {/* 👇 This wrapper grows to fill the screen */}
          <div className="flex-1 flex flex-col">
            {children}
          </div>
        </SettingsProvider>

        <Toaster />
      </body>
    </html>
  );
}
