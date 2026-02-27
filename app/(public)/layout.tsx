import { ConditionalLayout } from "@/app/conditional-layout";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ConditionalLayout>{children}</ConditionalLayout>;
}
