import Image from "next/image";
import Link from "next/link";
import { NavMenu } from "@/components/layout/sidebar";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 flex h-16 items-center border-b bg-background px-4 md:px-6">
      <Link href="/" className="flex items-center gap-2 font-semibold">
        <Image
          src="/FaithConnectLogoWhite.png"
          alt="Faith Connect Logo"
          width={128}
          height={128}
          className="h-24 w-32"
        />
        {/* <span className="font-semibold">FAITH Connect</span> */}
      </Link>

      <div className="ml-auto">
        <NavMenu />
      </div>
    </header>
  );
}
