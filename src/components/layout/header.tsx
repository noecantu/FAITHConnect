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
          width={130}
          height={130}
          className="h-28 w-34"
        />
        {/* <span className="font-semibold">FAITH Connect</span> */}
      </Link>

      <div className="ml-auto">
        <NavMenu />
      </div>
    </header>
  );
}
