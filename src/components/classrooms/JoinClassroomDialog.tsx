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
import { Input } from '@/components/ui/input';

const formSchema = z.object({
  join_code: z.string().min(6, 'Join code must be at least 6 characters.'),
});

type JoinClassroomFormValues = z.infer<typeof formSchema>;

interface JoinClassroomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: JoinClassroomFormValues) => void;
  isPending: boolean;
}

export const JoinClassroomDialog = ({ open, onOpenChange, onSubmit, isPending }: JoinClassroomDialogProps) => {
  const form = useForm<JoinClassroomFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { join_code: '' },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Join Classroom</DialogTitle>
          <DialogDescription>Enter the join code provided by your class representative.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="join_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Join Code</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., A1B2C3" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Joining...' : 'Join Classroom'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};