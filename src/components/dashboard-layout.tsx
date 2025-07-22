'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import { produce } from 'immer';
import type { AppData } from '@/lib/types';
import { initialData } from '@/lib/data';
import { LayoutDashboard, Target, CalendarDays, Car, PiggyBank, Briefcase, Plane, LogOut, ListTodo, Globe, Menu } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EditProfileDialog } from './edit-profile-dialog';
import { useToast } from '@/hooks/use-toast';
import { ThemeSwitcher } from './theme-switcher';
import { cn } from '@/lib/utils';
import Link from 'next/link';

// Global cache to prevent re-fetching data on navigation
let globalDataCache: { data: AppData | null; userId: string | null; timestamp: number } = {
  data: null,
  userId: null,
  timestamp: 0
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const navigationTabs = [
  { value: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
  { value: '/goals', label: 'Goals', icon: <Target className="h-4 w-4" /> },
  { value: '/daily-tasks', label: 'Daily To-Do', icon: <ListTodo className="h-4 w-4" /> },
  { value: '/monthly-plan', label: 'Monthly Plan', icon: <CalendarDays className="h-4 w-4" /> },
  { value: '/job-search', label: 'Job Search', icon: <Briefcase className="h-4 w-4" /> },
  { value: '/living-advisor', label: 'Living Advisor', icon: <Globe className="h-4 w-4" /> },
  { value: '/travel-goals', label: 'Travel Goals', icon: <Plane className="h-4 w-4" /> },
  { value: '/car-sale', label: 'Car Sale', icon: <Car className="h-4 w-4" /> },
  { value: '/finance', label: 'Finance Tracker', icon: <PiggyBank className="h-4 w-4" /> },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [isProfileDialogOpen, setProfileDialogOpen] = useState(false);
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user data with caching
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      // Check if we have fresh cached data for this user
      const now = Date.now();
      if (
        globalDataCache.data && 
        globalDataCache.userId === user.id && 
        (now - globalDataCache.timestamp) < CACHE_DURATION
      ) {
        setData(globalDataCache.data);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data: userData, error } = await supabase
          .from('users')
          .select('data')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        const finalData = userData?.data || initialData;
        
        if (!userData?.data) {
          // Initialize with default data
          await supabase
            .from('users')
            .upsert({ id: user.id, data: initialData });
        }

        // Update cache and state
        globalDataCache = {
          data: finalData,
          userId: user.id,
          timestamp: Date.now()
        };
        setData(finalData);
      } catch (error) {
        console.error('Error loading data:', error);
        setData(initialData);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Update data function with optimistic updates and caching
  const updateData = useCallback((updater: (draft: AppData) => void) => {
    if (!data || !user) return;
    
    const newData = produce(data, updater);
    
    // Optimistic update
    setData(newData);
    
    // Update cache
    globalDataCache = {
      data: newData,
      userId: user.id,
      timestamp: Date.now()
    };
    
    // Debounced database update
    updateDataInSupabase(newData);
  }, [data, user]);

  // Debounced Supabase update function
  const updateDataInSupabase = useCallback(
    useMemo(() => {
      let timeoutId: NodeJS.Timeout;
      return async (updatedData: AppData) => {
        if (!user) return;
        
        clearTimeout(timeoutId);
        timeoutId = setTimeout(async () => {
          try {
            const { error } = await supabase
              .from('users')
              .update({ data: updatedData })
              .eq('id', user.id);
            if (error) throw error;
          } catch (error: any) {
            console.error('Error updating data:', error);
            toast({
              variant: 'destructive',
              title: 'Failed to save changes',
              description: 'Your recent changes could not be saved.',
            });
          }
        }, 1000); // 1 second debounce
      };
    }, [user, toast]),
    [user, toast]
  );

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto max-w-7xl overflow-hidden rounded-2xl bg-transparent shadow-xl border border-white/10">
        <header className="flex items-center justify-between gap-4 bg-transparent p-4 sm:p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="lg:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 flex flex-col">
                  <SheetHeader className="p-6 border-b">
                    <SheetTitle className="flex items-center gap-3">
                      <img 
                        src="/icon.svg" 
                        alt="Resolve25 Logo" 
                        className="h-6 w-6"
                      />
                      <div className="flex flex-col text-left">
                        <span className="font-bold">Resolve25</span>
                        <span className="text-xs text-muted-foreground font-normal">Your AI-powered Life OS</span>
                      </div>
                    </SheetTitle>
                  </SheetHeader>
                  <ScrollArea className="flex-1 p-6">
                    <div className="space-y-2">
                      {navigationTabs.map((tab) => (
                        <SheetClose asChild key={tab.value}>
                          <Link
                            href={tab.value}
                            className={cn(
                              "flex items-center gap-3 w-full p-3 rounded-lg text-left transition-colors",
                              pathname === tab.value
                                ? "bg-accent text-accent-foreground border border-border"
                                : "hover:bg-accent/50 hover:text-accent-foreground"
                            )}
                          >
                            {tab.icon}
                            <span>{tab.label}</span>
                          </Link>
                        </SheetClose>
                      ))}
                    </div>
                  </ScrollArea>
                </SheetContent>
              </Sheet>
            </div>
            <div className="flex items-center gap-3">
              <img 
                src="/icon.svg" 
                alt="Resolve25 Logo" 
                className="h-8 w-8"
              />
              <div className="flex flex-col">
                <h1 className="text-2xl font-bold leading-tight">Resolve25</h1>
                <p className="text-xs text-muted-foreground">Your AI-powered Life OS</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeSwitcher />
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.user_metadata?.avatar_url} alt={user.user_metadata?.name || user.email} />
                      <AvatarFallback>{(user.user_metadata?.name || user.email)?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.user_metadata?.name || 'User'}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setProfileDialogOpen(true)}>
                    Edit Profile
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </header>

        {/* Desktop Navigation */}
        <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 hidden lg:block">
          <div className="px-2">
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex h-auto p-2 space-x-1">
                {navigationTabs.map((tab) => (
                  <Link
                    key={tab.value}
                    href={tab.value}
                    className={cn(
                      "inline-flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                      pathname === tab.value
                        ? "bg-accent text-accent-foreground border border-border"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
                    )}
                  >
                    {tab.icon}
                    {tab.label}
                  </Link>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        <div className="relative p-4 md:p-8 bg-transparent">
          {React.cloneElement(children as React.ReactElement<{ data?: AppData; onUpdate?: (updater: (draft: AppData) => void) => void }>, { data, onUpdate: updateData })}
        </div>
      </div>

      <EditProfileDialog
        open={isProfileDialogOpen}
        onOpenChange={setProfileDialogOpen}
      />
    </>
  );
}
