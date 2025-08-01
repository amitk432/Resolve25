'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

interface FeatureGuardProps {
  featureName: string;
  children: React.ReactNode;
}

const FEATURE_ROUTE_MAP: Record<string, string> = {
  'goals': 'goals',
  'daily-todo': 'daily-tasks',
  'monthly-plan': 'monthly-plan', 
  'job-search': 'job-search',
  'living-advisor': 'living-advisor',
  'travel-goals': 'travel-goals',
  'car-sale': 'car-sale',
  'finance': 'finance',
  'dashboard': 'dashboard',
  'ai-task-manager': 'ai-task-manager',
};

export function FeatureGuard({ featureName, children }: FeatureGuardProps) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait for auth to load
    if (authLoading) return;

    // If no user, let the individual page handle auth redirect
    if (!user) return;

    // Dashboard is always allowed (mandatory feature)
    if (featureName === 'dashboard') {
      return;
    }

    // Check if user has enabled features preferences
    const userEnabledFeatures = user?.user_metadata?.enabled_features;

    // If no preferences are set, redirect non-dashboard features to dashboard
    if (!userEnabledFeatures || !Array.isArray(userEnabledFeatures)) {
      router.push('/dashboard');
      return;
    }

    // If the feature is not in user's enabled features, redirect to dashboard
    if (!userEnabledFeatures.includes(featureName)) {
      router.push('/dashboard');
      return;
    }
  }, [user, authLoading, featureName, router]);

  // Show loading while checking access
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If no user, let the page handle it
  if (!user) {
    return <>{children}</>;
  }

  // Dashboard is always allowed (mandatory feature)
  if (featureName === 'dashboard') {
    return <>{children}</>;
  }

  // Check feature access
  const userEnabledFeatures = user?.user_metadata?.enabled_features;
  
  // If no preferences set, only allow dashboard access
  if (!userEnabledFeatures || !Array.isArray(userEnabledFeatures)) {
    // Show access denied for non-dashboard features
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
        <div className="max-w-md mx-auto">
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <svg className="w-10 h-10 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m9-7a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Feature Not Available</h1>
          <p className="text-muted-foreground mb-6">
            Please go to your profile settings and select the features you want to use.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If feature is enabled, show content
  if (userEnabledFeatures.includes(featureName)) {
    return <>{children}</>;
  }

  // Feature not enabled - show access denied page
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
      <div className="max-w-md mx-auto">
        <div className="mb-6">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <svg className="w-10 h-10 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m9-7a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Feature Not Available</h1>
        <p className="text-muted-foreground mb-6">
          This feature has been disabled in your profile settings. You can enable it by going to your profile and selecting the features you want to use.
        </p>
        <div className="space-y-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Go to Dashboard
          </button>
          <button
            onClick={() => router.back()}
            className="w-full px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}

export default FeatureGuard;
