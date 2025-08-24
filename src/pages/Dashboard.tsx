import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Dashboard = () => {
  const { user, profile, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Dashboard</CardTitle>
          <CardDescription>Welcome to your attendance app!</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            Welcome, <span className="font-semibold">{profile?.display_name || user?.email}</span>!
          </p>
          <p>
            Your role is: <span className="font-semibold capitalize">{profile?.role}</span>
          </p>
          <Button onClick={signOut} className="w-full">
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;