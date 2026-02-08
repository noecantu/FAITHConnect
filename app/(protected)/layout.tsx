import { AuthGuard } from "@/app/components/auth/auth-guard";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>;
}
