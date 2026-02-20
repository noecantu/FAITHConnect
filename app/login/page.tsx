'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from "@/app/lib/firebase-client";
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card';
import { Label } from '@/app/components/ui/label';
import { useToast } from '@/app/hooks/use-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 1. Sign in with Firebase Auth
      const { user } = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
console.log("🔥 After signIn, auth.currentUser:", auth.currentUser);
      // 2. Create Firebase session cookie
      const idToken = await user.getIdToken(true);

      await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      // 3. Fetch user profile so we know where to redirect
      const profileRes = await fetch("/api/users/me");
      const profile = await profileRes.json();

      // Member-level roles (non-admin)
      const isMemberLevel =
        profile.roles.includes("Member") ||
        profile.roles.includes("MusicManager") ||
        profile.roles.includes("MusicMember") ||
        profile.roles.includes("EventManager") ||
        profile.roles.includes("Finance") ||
        profile.roles.includes("AttendanceManager") ||
        profile.roles.includes("ServiceManager") ||
        profile.roles.includes("MemberManager");

      toast({ title: "Login Successful", description: "Welcome back!" });

        // 4. Redirect based on role
        const isSystemUser =
          profile.roles.includes("RootAdmin") ||
          profile.roles.includes("SystemAdmin");

        if (isSystemUser) {
          router.replace("/admin");
          return;
        }

        if (profile.roles.includes("Admin") || profile.roles.includes("ChurchAdmin")) {
          if (profile.churchId) {
            router.replace(`/admin/church/${profile.churchId}`);
          } else {
            router.replace("/onboarding/create-church");
          }
          return;
        }

        if (isMemberLevel) {
          if (profile.churchId) {
            router.replace(`/church/${profile.churchId}/user`);
          } else {
            router.replace("/");
          }
          return;
        }

        // fallback
        router.replace("/");

    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: 'Login Failed',
        description: 'The email or password you entered is incorrect.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <Card className="w-full max-w-sm bg-card">
        <CardHeader className="text-center space-y-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/F-Flame_Vector.svg"
            alt="Faith Connect Logo"
            className="mx-auto h-20 w-20"
          />
          <CardTitle>FAITH Connect</CardTitle>
          <CardDescription>Log in to your account</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Log In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
