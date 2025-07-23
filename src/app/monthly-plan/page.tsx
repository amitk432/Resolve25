'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import DashboardLayout from '@/components/dashboard-layout';
import MonthlyPlanWrapper from '@/components/monthly-plan-wrapper';

export default function MonthlyPlanPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const hasRedirected = useRef(false);

  useEffect(() => {
    // Only redirect if we've completed loading and confirmed no user
    // Prevent multiple redirects
    if (!authLoading && !user && !hasRedirected.current) {
      hasRedirected.current = true;
      router.push('/');
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout>
      <MonthlyPlanWrapper />
    </DashboardLayout>
  );
}
