'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

export default function SignupForm() {
  const { login, loading, error } = useAuth();

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>Click the button below to sign up.</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        )}
        <Button asChild className="w-full" disabled={loading}>
          <a href="/api/auth/login?screen_hint=signup">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign Up
          </a>
        </Button>
        <div className="mt-6 text-center text-sm">
          Already have an account?{' '}
          <Link href="/" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
