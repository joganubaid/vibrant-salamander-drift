import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { SignUpForm } from '@/components/auth/SignUpForm';

const AuthPage = () => {
  const { session } = useAuth();
  const location = useLocation();
  const isSignUp = location.pathname === '/signup';

  if (session) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center">
          {isSignUp ? 'Create an Account' : 'Welcome Back'}
        </h2>
        
        {isSignUp ? (
          <SignUpForm />
        ) : (
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            providers={[]}
            view="sign_in"
            theme="light"
            redirectTo={`${window.location.origin}/dashboard`}
          />
        )}

        <p className="text-center text-sm text-muted-foreground">
          {isSignUp ? (
            <>
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-primary hover:underline">
                Sign In
              </Link>
            </>
          ) : (
            <>
              Don't have an account?{' '}
              <Link to="/signup" className="font-semibold text-primary hover:underline">
                Sign Up
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
};

export default AuthPage;