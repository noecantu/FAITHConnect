'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from "@/app/lib/firebase-client";
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card';
import { Label } from '@/app/components/ui/label';
import { useToast } from '@/app/hooks/use-toast';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const { toast } = useToast();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { user } = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      const idToken = await user.getIdToken(true);

      await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      await fetch('/api/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          email,
          firstName,
          lastName,
          roles: ['Admin'],
          churchId: null,
        }),
      });

      const profileRes = await fetch("/api/users/me");
      const profile = await profileRes.json();

      toast({ title: "Account Created", description: "Welcome to FAITH Connect!" });

      if (profile.roles.includes("root")) {
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

      if (profile.roles.includes("Member")) {
        router.replace("/members");
        return;
      }

      router.replace("/");

    } catch (error) {
      console.error('Signup error:', error);
      toast({
        title: 'Signup Failed',
        description: 'Unable to create your account.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-zinc-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Card className="backdrop-blur-xl bg-zinc-900/60 border-zinc-800 shadow-2xl">
          <CardHeader className="text-center space-y-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/FAITH_CONNECT_FLAME_LOGO.svg"
              alt="FAITH Connect Logo"
              className="mx-auto h-20 w-20"
            />
            <CardTitle>Create Your Account</CardTitle>
            <CardDescription>Start Your Church on FAITH Connect</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSignup} className="space-y-5">
              <div className="space-y-2">
                <Label className="text-zinc-300">First Name</Label>
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="bg-zinc-800/50 border-zinc-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300">Last Name</Label>
                <Input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="bg-zinc-800/50 border-zinc-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300">Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-zinc-800/50 border-zinc-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300">Password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-zinc-800/50 border-zinc-700 text-white"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="
                  w-full
                  bg-slate-700 
                  hover:bg-slate-600 
                  text-white 
                  font-medium 
                  border 
                  border-slate-600 
                  shadow-sm
                "
              >
                {isLoading ? 'Creating...' : 'Create Account'}
              </Button>

            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
