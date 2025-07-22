'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

export default function AuthCodeError() {
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    // Wait a bit before showing the error to allow for successful auth redirects
    const timer = setTimeout(() => {
      setShowError(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (!showError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <div className="max-w-md p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <h1 className="text-2xl font-semibold mb-2">Completing Authentication</h1>
          <p className="text-muted-foreground">
            Please wait while we finish setting up your account...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="max-w-md p-8 text-center">
        <h1 className="text-4xl font-bold text-destructive mb-4">Authentication Error</h1>
        <p className="text-lg text-muted-foreground mb-8">
          There was an error during the authentication process. Please try again.
        </p>
        <Link 
          href="/login"
          className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 inline-block"
        >
          Go to Login
        </Link>
      </div>
    </div>
  );
}
