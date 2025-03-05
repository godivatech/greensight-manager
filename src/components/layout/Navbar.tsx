
import React, { useState } from 'react';
import { User, Bell, Search, CalendarDays, MessageSquare } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const Navbar: React.FC = () => {
  const { userData, logout } = useAuth();
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <div className="glass-effect h-16 border-b border-border/60 sticky top-0 z-20 w-full">
      <div className="flex h-full items-center justify-between px-4">
        <div className={cn(
          "relative w-full max-w-sm hidden md:flex items-center transition-all duration-300",
          searchFocused ? "max-w-xl" : "max-w-sm"
        )}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search everything..."
            className="w-full rounded-full bg-background pl-10 pr-4 h-10 shadow-sm border-border/40"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
        </div>

        <div className="flex items-center gap-3 ml-auto">
          <Button size="icon" variant="ghost" className="relative hidden md:flex">
            <CalendarDays className="h-5 w-5" />
          </Button>

          <Button size="icon" variant="ghost" className="relative hidden md:flex">
            <MessageSquare className="h-5 w-5" />
            <Badge className="absolute -right-1 -top-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]">2</Badge>
          </Button>

          <Button size="icon" variant="ghost" className="relative">
            <Bell className="h-5 w-5" />
            <Badge className="absolute -right-1 -top-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]">3</Badge>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9 border-2 border-primary/20">
                  <AvatarImage src="" alt={userData?.name || 'User'} />
                  <AvatarFallback className="bg-primary/10 text-primary font-medium">
                    {userData?.name?.charAt(0) || <User className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-60" align="end" forceMount>
              <DropdownMenuLabel className="font-normal p-4 pb-2">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{userData?.name || 'User'}</p>
                  <p className="text-xs leading-none text-muted-foreground mt-1">{userData?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="p-2">
                <DropdownMenuItem className="cursor-pointer">Profile Settings</DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">Company Settings</DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">Billing</DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">Team Members</DropdownMenuItem>
              </div>
              <DropdownMenuSeparator />
              <div className="p-2">
                <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive" onClick={() => logout()}>
                  Log out
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
