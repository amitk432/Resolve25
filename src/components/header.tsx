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
    <header className="flex h-24 items-center border-b-2 border-primary/20 bg-gradient-to-r from-background via-background/95 to-background/90 backdrop-blur-md px-6 md:px-8 sticky top-0 z-50 shadow-xl">
      <div className="flex items-center gap-6">
        <div className="bg-gradient-to-br from-primary to-accent p-4 rounded-2xl shadow-xl ring-2 ring-primary/20">
          <Target className="h-10 w-10 text-white drop-shadow-sm" />
        </div>
        <div className="flex flex-col">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Resolve 25</h1>
            <p className="text-base text-muted-foreground hidden sm:block font-semibold tracking-wide">Your AI-powered Life OS</p>
        </div>
      </div>
      <div className="ml-auto flex items-center gap-4">
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full ring-2 ring-primary/20 hover:ring-primary/40 transition-all duration-200">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user?.user_metadata?.avatar_url || user?.user_metadata?.picture || undefined} alt={user?.user_metadata?.name || user?.user_metadata?.full_name || 'User'} />
                  <AvatarFallback className="bg-gradient-primary text-white font-semibold">{(user?.user_metadata?.name || user?.user_metadata?.full_name)?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase()}</AvatarFallback>
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
