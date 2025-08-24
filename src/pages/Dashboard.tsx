import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Subject, SubjectWithAttendance } from '@/types';
import { SubjectCard } from '@/components/subjects/SubjectCard';
import { SubjectDialog } from '@/components/subjects/SubjectDialog';
import { useState } from 'react';
import { showError, showSuccess } from '@/utils/toast';
import { PlusCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [deletingSubjectId, setDeletingSubjectId] = useState<string | null>(null);

  const { data: subjects, isLoading } = useQuery<SubjectWithAttendance[]>({
    queryKey: ['subjects', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('subjects')
        .select('*, attendance_records(*)')
        .eq('user_id', user.id);
      if (error) throw new Error(error.message);
      return data || [];
    },
    enabled: !!user,
  });

  const mutation = useMutation({
    mutationFn: async (subjectData: Partial<Subject> & { id?: string, name: string }) => {
      if (!user) throw new Error('User not authenticated');
      const dataToUpsert = {
        ...subjectData,
        user_id: user.id,
        id: subjectData.id,
      };
      const { error } = await supabase.from('subjects').upsert(dataToUpsert);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects', user?.id] });
      showSuccess(`Subject ${editingSubject ? 'updated' : 'added'} successfully!`);
      setIsDialogOpen(false);
      setEditingSubject(null);
    },
    onError: (error) => {
      showError(error.message);
    },
  });

  const attendanceMutation = useMutation({
    mutationFn: async ({ subjectId, status }: { subjectId: string; status: 'attended' | 'missed' | 'off' }) => {
      if (!user) throw new Error('User not authenticated');
      const today = new Date().toISOString().split('T')[0];
      const { error } = await supabase.from('attendance_records').upsert({
        user_id: user.id,
        subject_id: subjectId,
        date: today,
        status: status,
      }, { onConflict: 'user_id,subject_id,date' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects', user?.id] });
      showSuccess('Attendance marked!');
    },
    onError: (error) => {
      showError(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (subjectId: string) => {
      const { error } = await supabase.from('subjects').delete().eq('id', subjectId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects', user?.id] });
      showSuccess('Subject deleted successfully!');
      setIsAlertOpen(false);
      setDeletingSubjectId(null);
    },
    onError: (error) => {
      showError(error.message);
    },
  });

  const handleEdit = (subject: Subject) => {
    setEditingSubject(subject);
    setIsDialogOpen(true);
  };

  const handleDeleteRequest = (subjectId: string) => {
    setDeletingSubjectId(subjectId);
    setIsAlertOpen(true);
  };

  const confirmDelete = () => {
    if (deletingSubjectId) {
      deleteMutation.mutate(deletingSubjectId);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">My Subjects</h1>
            <p className="text-muted-foreground">Track your attendance for all your subjects here.</p>
          </div>
          <div className="flex items-center gap-4">
            <Button onClick={() => { setEditingSubject(null); setIsDialogOpen(true); }}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Subject
            </Button>
            <Button onClick={signOut} variant="outline">Sign Out</Button>
          </div>
        </header>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-64 w-full" />)}
          </div>
        ) : subjects && subjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjects.map((subject) => (
              <SubjectCard
                key={subject.id}
                subject={subject}
                onMarkAttendance={attendanceMutation.mutate}
                onEdit={handleEdit}
                onDelete={handleDeleteRequest}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <h3 className="text-xl font-semibold">No subjects yet!</h3>
            <p className="text-muted-foreground mt-2">Click "Add Subject" to get started.</p>
          </div>
        )}
      </div>

      <SubjectDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={(values) => mutation.mutate({ ...values, id: editingSubject?.id })}
        subject={editingSubject}
        isPending={mutation.isPending}
      />

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the subject and all its attendance records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Dashboard;