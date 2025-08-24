import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { EnrolledClassroom, OwnedClassroom } from '@/types';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { showError, showSuccess } from '@/utils/toast';
import { CreateClassroomDialog } from '@/components/classrooms/CreateClassroomDialog';
import { JoinClassroomDialog } from '@/components/classrooms/JoinClassroomDialog';
import { ClassroomCard } from '@/components/classrooms/ClassroomCard';

const Classrooms = () => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);

  const { data: ownedClassrooms, isLoading: isLoadingOwned } = useQuery<OwnedClassroom[]>({
    queryKey: ['owned-classrooms', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('classrooms')
        .select('*, enrollments(count)')
        .eq('owner_id', user.id);
      if (error) throw new Error(error.message);
      return data || [];
    },
    enabled: !!user && profile?.role === 'owner',
  });

  const { data: enrolledClassrooms, isLoading: isLoadingEnrolled } = useQuery<EnrolledClassroom[]>({
    queryKey: ['enrolled-classrooms', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('enrollments')
        .select('classroom:classrooms!inner(*, profiles:owner_id(display_name))')
        .eq('user_id', user.id);
      if (error) throw new Error(error.message);
      // The query returns an array of { classroom: ... }, so we need to map it
      return data?.map(item => item.classroom as EnrolledClassroom).filter(Boolean) || [];
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async ({ name }: { name: string }) => {
      if (!user) throw new Error('User not authenticated');
      const join_code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const { error } = await supabase.from('classrooms').insert({ name, owner_id: user.id, join_code });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owned-classrooms', user?.id] });
      showSuccess('Classroom created successfully!');
      setIsCreateDialogOpen(false);
    },
    onError: (error) => showError(error.message),
  });

  const joinMutation = useMutation({
    mutationFn: async ({ join_code }: { join_code: string }) => {
      if (!user) throw new Error('User not authenticated');
      const { data: classroom, error: fetchError } = await supabase
        .from('classrooms')
        .select('id')
        .eq('join_code', join_code)
        .single();
      if (fetchError || !classroom) throw new Error('Invalid join code.');
      const { error: enrollError } = await supabase.from('enrollments').insert({ user_id: user.id, classroom_id: classroom.id });
      if (enrollError) throw new Error('You are already enrolled in this classroom.');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrolled-classrooms', user?.id] });
      showSuccess('Successfully joined classroom!');
      setIsJoinDialogOpen(false);
    },
    onError: (error) => showError(error.message),
  });

  const isLoading = isLoadingOwned || isLoadingEnrolled;

  return (
    <div className="max-w-7xl mx-auto">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">My Classrooms</h1>
          <p className="text-muted-foreground">Manage and access your classrooms.</p>
        </div>
        <div className="flex gap-2">
          {profile?.role === 'owner' && (
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Create Classroom
            </Button>
          )}
          <Button variant="outline" onClick={() => setIsJoinDialogOpen(true)}>
            Join Classroom
          </Button>
        </div>
      </header>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
        </div>
      ) : (
        <div className="space-y-8">
          {profile?.role === 'owner' && ownedClassrooms && ownedClassrooms.length > 0 && (
            <section>
              <h2 className="text-2xl font-semibold mb-4">Owned by You</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ownedClassrooms.map((classroom) => (
                  <ClassroomCard
                    key={classroom.id}
                    name={classroom.name}
                    memberCount={classroom.enrollments[0]?.count || 0}
                  />
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="text-2xl font-semibold mb-4">Enrolled Classrooms</h2>
            {enrolledClassrooms && enrolledClassrooms.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {enrolledClassrooms.map((classroom) => (
                  <ClassroomCard
                    key={classroom.id}
                    name={classroom.name}
                    ownerName={classroom.profiles?.display_name || 'N/A'}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 border-2 border-dashed rounded-lg">
                <h3 className="text-xl font-semibold">You haven't joined any classrooms yet.</h3>
                <p className="text-muted-foreground mt-2">Click "Join Classroom" to get started.</p>
              </div>
            )}
          </section>
        </div>
      )}

      <CreateClassroomDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={createMutation.mutate}
        isPending={createMutation.isPending}
      />
      <JoinClassroomDialog
        open={isJoinDialogOpen}
        onOpenChange={setIsJoinDialogOpen}
        onSubmit={joinMutation.mutate}
        isPending={joinMutation.isPending}
      />
    </div>
  );
};

export default Classrooms;