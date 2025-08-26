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
import { Subject, AttendanceRecord } from '@/types';
import { format } from 'date-fns';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { showError, showSuccess } from '@/utils/toast';
import { useEffect } from 'react';

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
  subjects: Subject[];
  existingRecord?: AttendanceRecord | null;
}

export const MarkAttendanceDialog = ({
  open,
  onOpenChange,
  selectedDate,
  subjects,
  existingRecord,
}: MarkAttendanceDialogProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const form = useForm<MarkAttendanceFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subject_id: existingRecord?.subject_id || '',
      status: existingRecord?.status || 'attended',
    },
  });

  // Reset form values when dialog opens or existingRecord changes
  useEffect(() => {
    if (open) {
      form.reset({
        subject_id: existingRecord?.subject_id || '',
        status: existingRecord?.status || 'attended',
      });
    }
  }, [open, existingRecord, form]);

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
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
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