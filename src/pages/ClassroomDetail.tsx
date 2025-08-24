import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Classroom, Material } from '@/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Upload } from 'lucide-react';
import { MaterialUploadDialog } from '@/components/classrooms/MaterialUploadDialog';
import { MaterialList } from '@/components/classrooms/MaterialList';

const ClassroomDetail = () => {
  const { id: classroomId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);

  const { data: classroom, isLoading: isLoadingClassroom } = useQuery<Classroom | null>({
    queryKey: ['classroom', classroomId],
    queryFn: async () => {
      if (!classroomId) return null;
      const { data, error } = await supabase
        .from('classrooms')
        .select('*')
        .eq('id', classroomId)
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!classroomId,
  });

  const { data: materials, isLoading: isLoadingMaterials } = useQuery<Material[]>({
    queryKey: ['materials', classroomId],
    queryFn: async () => {
      if (!classroomId) return [];
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('classroom_id', classroomId)
        .order('uploaded_at', { ascending: false });
      if (error) throw new Error(error.message);
      return data || [];
    },
    enabled: !!classroomId,
  });

  const isOwner = user?.id === classroom?.owner_id;
  const isLoading = isLoadingClassroom || isLoadingMaterials;

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-10 w-1/4" />
        <Skeleton className="h-8 w-1/2" />
        <div className="flex justify-end">
          <Skeleton className="h-10 w-36" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!classroom) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold">Classroom not found</h2>
        <Button asChild variant="link">
          <Link to="/classrooms">Go back to classrooms</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <Link to="/classrooms" className="flex items-center gap-2 text-sm text-muted-foreground hover:underline mb-4">
        <ArrowLeft className="h-4 w-4" />
        Back to Classrooms
      </Link>
      <header className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold">{classroom.name}</h1>
          <p className="text-muted-foreground">Join Code: <span className="font-mono bg-muted px-2 py-1 rounded">{classroom.join_code}</span></p>
        </div>
        {isOwner && (
          <Button onClick={() => setIsUploadDialogOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Material
          </Button>
        )}
      </header>

      <MaterialList materials={materials || []} />

      {isOwner && classroomId && (
        <MaterialUploadDialog
          open={isUploadDialogOpen}
          onOpenChange={setIsUploadDialogOpen}
          classroomId={classroomId}
        />
      )}
    </div>
  );
};

export default ClassroomDetail;