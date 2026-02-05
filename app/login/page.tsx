'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { useToast } from '../hooks/use-toast';

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
      // 1. Sign in
      const { user } = await signInWithEmailAndPassword(auth, email.trim(), password);

      // 2. Load Firestore user document
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await auth.signOut();
        toast({
          title: 'Login Error',
          description: 'Your account is missing required data.',
          variant: 'destructive',
        });
        return;
      }

      const data = userSnap.data();
      const roles = data.roles || [];
      const isRootAdmin = roles.includes("RootAdmin");
      const isAdmin = roles.includes("Admin");

      const churchId = data.churchId;

      // 3. ROOT ADMIN — bypass church lookup entirely
      if (isRootAdmin) {
        router.push('/admin');
        return;
      }

      // 4. Admins MUST have a churchId
      if (!churchId) {
        await auth.signOut();
        toast({
          title: 'Login Error',
          description: 'Your account is missing a church assignment.',
          variant: 'destructive',
        });
        return;
      }

      // 5. Load church document (safe now)
      const churchRef = doc(db, 'churches', churchId);
      const churchSnap = await getDoc(churchRef);

      if (!churchSnap.exists()) {
        await auth.signOut();
        toast({
          title: 'Login Error',
          description: 'Your church record is missing.',
          variant: 'destructive',
        });
        return;
      }

      const church = churchSnap.data();

      // 6. HARD BLOCK — disabled church
      if (church.status === 'disabled') {
        await auth.signOut();
        toast({
          title: 'Access Denied',
          description: 'Your church has been disabled. Please contact your administrator.',
          variant: 'destructive',
        });
        return;
      }

      // 7. Admin redirect
      if (isAdmin && churchId) {
        router.push(`/admin/churches/${churchId}`);
        return;
      }

      // 8. Default fallback
      toast({ title: 'Login Successful', description: 'Welcome back!' });
      router.push('/');

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
