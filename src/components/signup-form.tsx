'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

export default function SignupForm() {
  const { signUpWithEmail, signInWithProvider, loading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    await signUpWithEmail(email, password);
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>Enter your details to create an account.</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        )}
        <form onSubmit={handleEmailSignUp} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={!!loading}>
            {loading === 'email' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign up with Email
          </Button>
        </form>
        <div className="my-4 flex items-center">
          <div className="flex-grow border-t border-muted" />
          <span className="mx-4 text-muted-foreground">OR</span>
          <div className="flex-grow border-t border-muted" />
        </div>
        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => signInWithProvider('google')}
            disabled={!!loading}
          >
            {loading === 'google' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign up with Google
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => signInWithProvider('github')}
            disabled={!!loading}
          >
            {loading === 'github' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign up with GitHub
          </Button>
        </div>
        <div className="mt-6 text-center text-sm">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
