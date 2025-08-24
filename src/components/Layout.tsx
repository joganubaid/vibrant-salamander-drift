import { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { useAuth } from '@/context/AuthContext';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { Menu, BookOpen, Calendar, Users } from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: BookOpen },
  { name: 'Timetable', href: '/timetable', icon: Calendar },
  { name: 'Classrooms', href: '/classrooms', icon: Users },
];

const Layout = ({ children }: { children: ReactNode }) => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
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
          <Button onClick={handleSignOut} variant="outline">
            Sign Out
          </Button>
        </div>
      </header>
      <main className="flex-grow bg-muted/40 p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;