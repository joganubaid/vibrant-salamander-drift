import { useAuth } from '@/context/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { showError, showSuccess } from '@/utils/toast';
import { Profile } from '@/context/AuthContext';

const formSchema = z.object({
  display_name: z.string().min(2, 'Display name must be at least 2 characters.'),
});

type ProfileFormValues = z.infer<typeof formSchema>;

const ProfilePage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery<Profile | null>({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase.from('profiles').select('*').eq('user_id', user.id).single();
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!user,
  });

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(formSchema),
    values: {
      display_name: profile?.display_name || '',
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: ProfileFormValues) => {
      if (!user) throw new Error('User not authenticated');
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: values.display_name, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      // Trigger a session refresh to update context globally
      await supabase.auth.refreshSession();
      showSuccess('Profile updated successfully!');
    },
    onError: (error) => showError(error.message),
  });

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <Skeleton className="h-10 w-1/3 mb-6" />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-24 ml-auto" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">My Profile</h1>
        <p className="text-muted-foreground">Manage your account settings.</p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Profile Details</CardTitle>
          <CardDescription>Update your display name here.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((values) => mutation.mutate(values))} className="space-y-6">
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" value={user?.email || ''} disabled />
                </FormControl>
              </FormItem>
              <FormField
                control={form.control}
                name="display_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end">
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;