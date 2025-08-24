import { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { useAuth } from '@/context/AuthContext';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { Menu, BookOpen, Calendar, Users, CalendarDays, User as UserIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: BookOpen },
  { name: 'Timetable', href: '/timetable', icon: Calendar },
  { name: 'Calendar', href: '/calendar', icon: CalendarDays },
  { name: 'Classrooms', href: '/classrooms', icon: Users },
];

const Layout = ({ children }: { children: ReactNode }) => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return <UserIcon className="h-5 w-5" />;
    const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    return initials;
  };

  return (
    <div className="min-h-screen w-full flex flex-col">
      <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-50">
        <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
          <NavLink to="/dashboard" className="flex items-center gap-2 text-lg font-semibold md:text-base">
            <BookOpen className="h-6 w-6" />
            <span className="sr-only">Attendance Tracker</span>
          </NavLink>
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `transition-colors hover:text-foreground ${isActive ? 'text-foreground' : 'text-muted-foreground'}`
              }
            >
              {item.name}
            </NavLink>
          ))}
        </nav>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="shrink-0 md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <nav className="grid gap-6 text-lg font-medium">
              <NavLink to="/dashboard" className="flex items-center gap-2 text-lg font-semibold">
                <BookOpen className="h-6 w-6" />
                <span className="sr-only">Attendance Tracker</span>
              </NavLink>
              {navItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    `hover:text-foreground ${isActive ? 'text-foreground' : 'text-muted-foreground'}`
                  }
                >
                  {item.name}
                </NavLink>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
        <div className="flex w-full items-center justify-end gap-4 md:ml-auto md:gap-2 lg:gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                <Avatar>
                  <AvatarImage src="" alt={profile?.display_name || ''} />
                  <AvatarFallback>{getInitials(profile?.display_name)}</AvatarFallback>
                </Avatar>
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{profile?.display_name}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <main className="flex-grow bg-muted/40 p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;