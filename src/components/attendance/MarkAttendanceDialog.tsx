import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Subject, AttendanceRecord, TimetableEntryWithSubject } from '@/types';
import { format, getDay } from 'date-fns';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { showError, showSuccess } from '@/utils/toast';
import { useEffect, useMemo, useState } from 'react';
import { Switch } from '@/components/ui/switch'; // Import Switch component

const formSchema = z.object({
  subject_id: z.string().uuid('Please select a subject.'),
  status: z.enum(['attended', 'missed', 'off'], {
    required_error: 'Please select an attendance status.',
  }),
});

type MarkAttendanceFormValues = z.infer<typeof formSchema>;

interface MarkAttendanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date | undefined;
  subjects: Subject[]; // All subjects
  timetable: TimetableEntryWithSubject[]; // All timetable entries
  existingRecord?: AttendanceRecord | null;
}

export const MarkAttendanceDialog = ({
  open,
  onOpenChange,
  selectedDate,
  subjects,
  timetable,
  existingRecord,
}: MarkAttendanceDialogProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showAllSubjects, setShowAllSubjects] = useState(false); // State for the toggle

  const form = useForm<MarkAttendanceFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subject_id: existingRecord?.subject_id || '',
      status: existingRecord?.status || 'attended',
    },
  });

  // Reset form values and toggle state when dialog opens or existingRecord changes
  useEffect(() => {
    if (open) {
      form.reset({
        subject_id: existingRecord?.subject_id || '',
        status: existingRecord?.status || 'attended',
      });
      setShowAllSubjects(false); // Reset toggle when dialog opens
    }
  }, [open, existingRecord, form]);

  const filteredSubjects = useMemo(() => {
    if (!selectedDate || showAllSubjects) {
      return subjects; // Show all subjects if toggle is on or no date selected
    }

    const dayOfWeek = getDay(selectedDate); // 0 for Sunday, 1 for Monday, etc.
    const scheduledSubjectIds = timetable
      .filter(entry => entry.day_of_week === dayOfWeek)
      .map(entry => entry.subject_id);

    // Filter subjects to only include those scheduled for the selected day
    const scheduledSubjects = subjects.filter(subject =>
      scheduledSubjectIds.includes(subject.id)
    );

    // If there's an existing record for a subject not on the timetable for this day,
    // ensure that subject is still available in the dropdown for editing.
    if (existingRecord && !scheduledSubjectIds.includes(existingRecord.subject_id)) {
      const existingSubject = subjects.find(s => s.id === existingRecord.subject_id);
      if (existingSubject && !scheduledSubjects.some(s => s.id === existingSubject.id)) {
        return [...scheduledSubjects, existingSubject];
      }
    }

    return scheduledSubjects;
  }, [selectedDate, subjects, timetable, showAllSubjects, existingRecord]);

  const mutation = useMutation({
    mutationFn: async (values: MarkAttendanceFormValues) => {
      if (!user || !selectedDate) throw new Error('User not authenticated or date not selected.');

      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      const dataToUpsert = {
        user_id: user.id,
        subject_id: values.subject_id,
        date: formattedDate,
        status: values.status,
      };

      const { error } = await supabase.from('attendance_records').upsert(dataToUpsert, {
        onConflict: 'user_id,subject_id,date', // Unique constraint for upsert
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance_calendar', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['subjects', user?.id] }); // Also invalidate dashboard subjects to update attendance counts
      showSuccess('Attendance marked successfully!');
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      showError(error.message);
    },
  });

  const handleSubmit = (values: MarkAttendanceFormValues) => {
    mutation.mutate(values);
  };

  const dialogTitle = existingRecord ? 'Edit Attendance' : 'Mark Attendance';
  const dialogDescription = existingRecord
    ? `Update attendance for ${format(selectedDate || new Date(), 'PPP')}.`
    : `Mark attendance for ${format(selectedDate || new Date(), 'PPP')}.`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="subject_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a subject" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {filteredSubjects.length > 0 ? (
                        filteredSubjects.map((subject) => (
                          <SelectItem key={subject.id} value={subject.id}>
                            {subject.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-subjects" disabled>
                          No subjects scheduled for this day
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="show-all-subjects">Show all subjects</Label>
              <Switch
                id="show-all-subjects"
                checked={showAllSubjects}
                onCheckedChange={setShowAllSubjects}
              />
            </div>
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Attendance Status</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="attended" />
                        </FormControl>
                        <FormLabel className="font-normal">Attended</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="missed" />
                        </FormControl>
                        <FormLabel className="font-normal">Missed</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="off" />
                        </FormControl>
                        <FormLabel className="font-normal">Off (e.g., holiday, no class)</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Saving...' : 'Save Attendance'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};