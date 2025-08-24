import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

interface ClassroomCardProps {
  name: string;
  ownerName?: string;
  memberCount?: number;
}

export const ClassroomCard = ({ name, ownerName, memberCount }: ClassroomCardProps) => {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle>{name}</CardTitle>
        {ownerName && <CardDescription>Owner: {ownerName}</CardDescription>}
      </CardHeader>
      <CardContent>
        {memberCount !== undefined && (
          <div className="flex items-center text-sm text-muted-foreground">
            <Users className="h-4 w-4 mr-2" />
            <span>{memberCount} Member{memberCount !== 1 && 's'}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};