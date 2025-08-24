import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { SignUpForm } from '@/components/auth/SignUpForm';
import { useEffect } from 'react';

const AuthPage = () => {
  const { session } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isSignUp = location.pathname === '/signup';

  useEffect(() => {
    const joinCode = localStorage.getItem('join_classroom_code');
    if (session && joinCode) {
      navigate(`/join/${joinCode}`);
    } else if (session) {
      navigate('/dashboard');
    }
  }, [session, navigate]);

  if (session) {
    // Show a loading or redirecting state while useEffect runs
    return null;
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