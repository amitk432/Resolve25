'use client';

import { Target, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from './ui/button';

export default function Header() {
  const { user, signOut } = useAuth();

  return (
    <header className="flex h-16 items-center border-b bg-card px-4 md:px-6 sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <Target className="h-6 w-6 text-primary" />
        <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Resolve25</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">Your personal dashboard for achieving your goals.</p>
        </div>
      </div>
      <div className="ml-auto flex items-center gap-4">
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user?.user_metadata?.avatar_url || user?.user_metadata?.picture || undefined} alt={user?.user_metadata?.name || user?.user_metadata?.full_name || 'User'} />
                  <AvatarFallback>{(user?.user_metadata?.name || user?.user_metadata?.full_name)?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase()}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.user_metadata?.name || user?.user_metadata?.full_name || 'User'}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
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
  );
}
