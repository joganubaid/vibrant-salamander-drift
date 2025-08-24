import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const AuthPage = () => {
  const { session } = useAuth();
  const location = useLocation();

  if (session) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center">
          {location.pathname === '/signup' ? 'Create an Account' : 'Welcome Back'}
        </h2>
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={[]}
          view={location.pathname === '/signup' ? 'sign_up' : 'sign_in'}
          theme="light"
          redirectTo={`${window.location.origin}/dashboard`}
        />
      </div>
    </div>
  );
};

export default AuthPage;