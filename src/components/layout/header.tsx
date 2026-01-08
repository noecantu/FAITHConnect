import { MobileSidebar } from '@/components/layout/sidebar';

export default function Header() {
  return (
    <header className="flex h-16 items-center border-b bg-background px-4 md:px-6">
      <MobileSidebar />
      <div className="flex-1">
        {/* Placeholder for potential header content like search or user menu */}
      </div>
    </header>
  );
}
