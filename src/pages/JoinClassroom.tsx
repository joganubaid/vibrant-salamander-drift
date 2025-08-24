import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { Loader2 } from 'lucide-react';

const JoinClassroom = () => {
  const { joinCode } = useParams<{ joinCode: string }>();
  const { user, session, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const joinMutation = useMutation({
    mutationFn: async (code: string) => {
      if (!user) throw new Error('You must be logged in to join a classroom.');
      
      const { data: classroom, error: fetchError } = await supabase
        .from('classrooms')
        .select('id')
        .eq('join_code', code)
        .single();
        
      if (fetchError || !classroom) throw new Error('Invalid or expired join code.');
      
      const { error: enrollError } = await supabase.from('enrollments').insert({ 
        user_id: user.id, 
        classroom_id: classroom.id 
      });

      if (enrollError) {
        // Check for unique constraint violation
        if (enrollError.code === '23505') {
          throw new Error('You are already enrolled in this classroom.');
        }
        throw new Error(enrollError.message);
      }
      return classroom.id;
    },
    onSuccess: (classroomId) => {
      queryClient.invalidateQueries({ queryKey: ['enrolled-classrooms', user?.id] });
      showSuccess('Successfully joined classroom!');
      navigate(`/classrooms/${classroomId}`);
    },
    onError: (error: Error) => {
      showError(error.message);
      navigate('/classrooms');
    },
  });

  useEffect(() => {
    if (loading) return; // Wait for auth state to be determined

    if (!session) {
      // Store join code and redirect to login
      localStorage.setItem('join_classroom_code', joinCode || '');
      navigate('/login');
      return;
    }

    const codeToJoin = localStorage.getItem('join_classroom_code') || joinCode;
    if (codeToJoin) {
      joinMutation.mutate(codeToJoin);
      localStorage.removeItem('join_classroom_code');
    } else {
      navigate('/classrooms');
    }
  }, [session, loading, joinCode, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="mt-4 text-lg text-muted-foreground">Joining classroom...</p>
    </div>
  );
};

export default JoinClassroom;