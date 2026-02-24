// interface LayoutProps {
//   children: React.ReactNode;
// }

// export default function PublicLayout({ children }: LayoutProps) {
//   return (
//     <div className="min-h-screen">
//       {children}
//     </div>
//   );
// }

import { ConditionalLayout } from "@/app/conditional-layout";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ConditionalLayout>{children}</ConditionalLayout>;
}
