import Link from 'next/link';
import { FaithConnectLogo } from '@/components/icons';
import { NavMenu } from '@/components/layout/sidebar';

export default function Header({ setReportType }: { setReportType: (type: 'members' | 'contributions' | null) => void }) {
  return (
    <header className="sticky top-0 z-50 flex h-16 items-center border-b bg-background px-4 md:px-6">
      <Link href="/" className="flex items-center gap-2 font-semibold">
        <img
          src="/FAITH_CONNECT_FLAME_LOGO.svg"
          alt="Faith Connect Logo"
          className="h-28 w-28"
        />
      </Link>
      <div className="ml-auto">
        <NavMenu setReportType={setReportType} />
      </div>
    </header>
  );
}
