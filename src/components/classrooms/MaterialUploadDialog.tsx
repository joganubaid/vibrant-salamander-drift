import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
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
import { Input } from '@/components/ui/input';
import { showError, showSuccess } from '@/utils/toast';

const formSchema = z.object({
  subject_name: z.string().min(2, 'Subject name is required.'),
  unit_name: z.string().optional(),
  file: z.instanceof(FileList).refine((files) => files?.length === 1, 'File is required.'),
});

type MaterialUploadFormValues = z.infer<typeof formSchema>;

interface MaterialUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classroomId: string;
}

export const MaterialUploadDialog = ({ open, onOpenChange, classroomId }: MaterialUploadDialogProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const form = useForm<MaterialUploadFormValues>({
    resolver: zodResolver(formSchema),
  });

  const mutation = useMutation({
    mutationFn: async (values: MaterialUploadFormValues) => {
      if (!user || !values.file) throw new Error('User not authenticated or file not selected.');
      
      const file = values.file[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${classroomId}/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('materials').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase.from('materials').insert({
        classroom_id: classroomId,
        uploader_id: user.id,
        subject_name: values.subject_name,
        unit_name: values.unit_name,
        file_name: file.name,
        file_path: filePath,
        file_type: file.type,
      });
      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials', classroomId] });
      showSuccess('Material uploaded successfully!');
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      showError(error.message);
    },
  });

  const fileRef = form.register('file');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upload Material</DialogTitle>
          <DialogDescription>Select a file and provide details to share it with the class.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((values) => mutation.mutate(values))} className="space-y-4">
            <FormField
              control={form.control}
              name="subject_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Physics" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="unit_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit/Topic (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Thermodynamics" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="file"
              render={() => (
                <FormItem>
                  <FormLabel>File</FormLabel>
                  <FormControl>
                    <Input type="file" {...fileRef} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Uploading...' : 'Upload'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};