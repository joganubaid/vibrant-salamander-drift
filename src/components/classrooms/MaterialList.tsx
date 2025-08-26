import { Material } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface MaterialListProps {
  materials: Material[];
}

export const MaterialList = ({ materials }: MaterialListProps) => {
  const handleDownload = (filePath: string) => {
    const { data } = supabase.storage.from('materials').getPublicUrl(filePath);
    if (data.publicUrl) {
      window.open(data.publicUrl, '_blank');
    }
  };

  if (materials.length === 0) {
    return (
      <div className="text-center py-16 border-2 border-dashed rounded-lg">
        <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-xl font-semibold">No materials uploaded yet.</h3>
        <p className="text-muted-foreground mt-2">The classroom owner can upload materials for the class.</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Study Materials</CardTitle>
        <CardDescription>All the files shared in this classroom.</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto"> {/* Added overflow-x-auto here */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[150px]">File Name</TableHead> {/* Added min-width for better table display */}
              <TableHead className="min-w-[100px]">Subject</TableHead>
              <TableHead className="min-w-[100px]">Unit</TableHead>
              <TableHead className="min-w-[150px]">Uploaded On</TableHead>
              <TableHead className="text-right min-w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {materials.map((material) => (
              <TableRow key={material.id}>
                <TableCell className="font-medium">{material.file_name}</TableCell>
                <TableCell>{material.subject_name}</TableCell>
                <TableCell>{material.unit_name || 'N/A'}</TableCell>
                <TableCell>{format(new Date(material.uploaded_at), 'PP')}</TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" onClick={() => handleDownload(material.file_path)}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};