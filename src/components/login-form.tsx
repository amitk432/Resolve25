'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

export default function LoginForm() {
  const { login, loading, error } = useAuth();

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>Click the button below to log in or sign up.</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        )}
        <div className="flex flex-col gap-4">
          <Button
            asChild
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white"
            disabled={loading}
          >
            <a href="/api/auth/login">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Login/Signup
            </a>
          </Button>
        </div>
        <div className="mt-6 text-center text-sm">
          By signing up, you agree to our{' '}
          <Link href="/terms" className="font-medium text-primary hover:underline">
            Terms of Service
          </Link>
          {' '}and{' '}
          <Link href="/privacy" className="font-medium text-primary hover:underline">
            Privacy Policy
          </Link>
          .
        </div>
      </CardContent>
    </Card>
  );
}
