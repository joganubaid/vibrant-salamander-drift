import { SubjectWithAttendance } from '@/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useMemo } from 'react';

interface SubjectCardProps {
  subject: SubjectWithAttendance;
  onMarkAttendance: (subjectId: string, status: 'attended' | 'missed' | 'off') => void;
  onEdit: (subject: SubjectWithAttendance) => void;
  onDelete: (subjectId: string) => void;
}

export const SubjectCard = ({ subject, onMarkAttendance, onEdit, onDelete }: SubjectCardProps) => {
  const { percentage, attended, missed, total } = useMemo(() => {
    // Ensure attendance_records is an array, even if it's undefined or null
    const records = subject.attendance_records ?? [];
    const attended = records.filter((r) => r.status === 'attended').length;
    const missed = records.filter((r) => r.status === 'missed').length;
    const total = attended + missed;
    const percentage = total > 0 ? Math.round((attended / total) * 100) : 0;
    return { percentage, attended, missed, total };
  }, [subject.attendance_records]);

  const isBelowThreshold = percentage < subject.threshold;

  const todayRecord = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    // Ensure attendance_records is an array, even if it's undefined or null
    const records = subject.attendance_records ?? [];
    return records.find((r) => r.date === today);
  }, [subject.attendance_records]);

  return (
    <Card style={{ borderLeft: `4px solid ${subject.color}` }}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{subject.name}</CardTitle>
            <CardDescription>
              {attended} / {total} classes attended
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => onEdit(subject)}>Edit</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(subject.id)} className="text-red-500">
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <span className={`text-xl font-bold ${isBelowThreshold ? 'text-red-500' : ''}`}>
            {percentage}%
          </span>
          <Progress value={percentage} className="w-full" />
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Threshold: {subject.threshold}%
        </p>
      </CardContent>
      <CardFooter className="flex justify-between gap-2">
        <Button
          variant={todayRecord?.status === 'attended' ? 'default' : 'outline'}
          className="w-full"
          onClick={() => onMarkAttendance(subject.id, 'attended')}
        >
          Attended
        </Button>
        <Button
          variant={todayRecord?.status === 'missed' ? 'destructive' : 'outline'}
          className="w-full"
          onClick={() => onMarkAttendance(subject.id, 'missed')}
        >
          Missed
        </Button>
        <Button
          variant={todayRecord?.status === 'off' ? 'secondary' : 'outline'}
          className="w-full"
          onClick={() => onMarkAttendance(subject.id, 'off')}
        >
          Off
        </Button>
      </CardFooter>
    </Card>
  );
};