import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Subject, TimetableEntry, TimetableEntryWithSubject } from '@/types';
import { Button } from '@/components/ui/button';
import { PlusCircle, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TimetableDialog } from '@/components/timetable/TimetableDialog';
import { showError, showSuccess } from '@/utils/toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const Timetable = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [deletingEntryId, setDeletingEntryId] = useState<string | null>(null);

  const { data: timetable, isLoading: isLoadingTimetable } = useQuery<TimetableEntryWithSubject[]>({
    queryKey: ['timetable', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('timetable')
        .select('*, subjects(name, color)')
        .eq('user_id', user.id);
      if (error) throw new Error(error.message);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: subjects, isLoading: isLoadingSubjects } = useQuery<Subject[]>({
    queryKey: ['subjects', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.from('subjects').select('*').eq('user_id', user.id);
      if (error) throw new Error(error.message);
      return data || [];
    },
    enabled: !!user,
  });

  const mutation = useMutation({
    mutationFn: async (entryData: Partial<TimetableEntry> & { id?: string }) => {
      if (!user) throw new Error('User not authenticated');
      const dataToUpsert = { ...entryData, user_id: user.id, id: entryData.id };
      const { error } = await supabase.from('timetable').upsert(dataToUpsert);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timetable', user?.id] });
      showSuccess(`Class ${editingEntry ? 'updated' : 'added'} successfully!`);
      setIsDialogOpen(false);
      setEditingEntry(null);
    },
    onError: (error) => showError(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (entryId: string) => {
      const { error } = await supabase.from('timetable').delete().eq('id', entryId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timetable', user?.id] });
      showSuccess('Class deleted successfully!');
      setIsAlertOpen(false);
      setDeletingEntryId(null);
    },
    onError: (error) => showError(error.message),
  });

  const handleEdit = (entry: TimetableEntry) => {
    setEditingEntry(entry);
    setIsDialogOpen(true);
  };

  const handleDeleteRequest = (entryId: string) => {
    setDeletingEntryId(entryId);
    setIsAlertOpen(true);
  };

  const confirmDelete = () => {
    if (deletingEntryId) {
      deleteMutation.mutate(deletingEntryId);
    }
  };

  const formatTime = (time: string) => {
    const [hour, minute] = time.split(':');
    const h = parseInt(hour, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const formattedHour = h % 12 === 0 ? 12 : h % 12;
    return `${formattedHour}:${minute} ${ampm}`;
  };

  const isLoading = isLoadingTimetable || isLoadingSubjects;

  return (
    <div className="max-w-7xl mx-auto">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">My Timetable</h1>
          <p className="text-muted-foreground">Manage your weekly class schedule.</p>
        </div>
        <Button onClick={() => { setEditingEntry(null); setIsDialogOpen(true); }}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Class
        </Button>
      </header>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-64 w-full" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {daysOfWeek.map((day, index) => {
            const entriesForDay = timetable
              ?.filter((e) => e.day_of_week === index)
              .sort((a, b) => a.start_time.localeCompare(b.start_time));
            return (
              <Card key={day}>
                <CardHeader>
                  <CardTitle>{day}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {entriesForDay && entriesForDay.length > 0 ? (
                    entriesForDay.map((entry) => (
                      <div key={entry.id} className="p-3 rounded-lg" style={{ borderLeft: `4px solid ${entry.subjects.color}` }}>
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold">{entry.subjects.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatTime(entry.start_time)} - {formatTime(entry.end_time)}
                            </p>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => handleEdit(entry)}>
                                <Edit className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDeleteRequest(entry.id)} className="text-red-500">
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No classes scheduled.</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {subjects && (
        <TimetableDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onSubmit={(values) => mutation.mutate({ ...values, id: editingEntry?.id })}
          entry={editingEntry}
          subjects={subjects}
          isPending={mutation.isPending}
        />
      )}

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this class from your timetable.
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

export default Timetable;