'use client';

import dynamic from "next/dynamic";

const NavMenu = dynamic(
  () => import("./NavMenu").then((m) => m.NavMenu),
  { ssr: false }
);

export default function NavMenuClientOnly() {
  return <NavMenu />;
}
