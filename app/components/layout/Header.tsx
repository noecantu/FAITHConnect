import Link from 'next/link';
import { NavMenu } from './NavMenu';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 flex h-16 items-center border-b bg-background px-4 md:px-6">
      <Link href="/" className="flex items-center gap-2 font-semibold">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/FAITH_CONNECT_FLAME_LOGO.svg"
          alt="Faith Connect Logo"
          className="h-10 w-10"   // or h-12 w-12
        />
      </Link>
      <div className="ml-auto">
        <NavMenu />
      </div>
    </header>
  );
}
