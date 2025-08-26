import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AttendanceRecordWithSubject, Subject, AttendanceRecord } from '@/types';
import { Calendar } from '@/components/ui/calendar';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit } from 'lucide-react';
import { MarkAttendanceDialog } from '@/components/attendance/MarkAttendanceDialog';

const CalendarPage = () => {
  const { user } = useAuth();
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(new Date());
  const [isMarkAttendanceDialogOpen, setIsMarkAttendanceDialogOpen] = useState(false);
  const [editingAttendanceRecord, setEditingAttendanceRecord] = useState<AttendanceRecord | null>(null);

  const { data: attendanceRecords, isLoading: isLoadingAttendance } = useQuery<AttendanceRecordWithSubject[]>({
    queryKey: ['attendance_calendar', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('attendance_records')
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

  const { attendedDays, missedDays, offDays } = useMemo(() => {
    const attended: Date[] = [];
    const missed: Date[] = [];
    const off: Date[] = [];
    attendanceRecords?.forEach(record => {
      const date = new Date(record.date.replace(/-/g, '/'));
      if (record.status === 'attended') attended.push(date);
      else if (record.status === 'missed') missed.push(date);
      else if (record.status === 'off') off.push(date);
    });
    return { attendedDays: attended, missedDays: missed, offDays: off };
  }, [attendanceRecords]);

  const recordsForSelectedDay = useMemo(() => {
    if (!selectedDay || !attendanceRecords) return [];
    const formattedDate = format(selectedDay, 'yyyy-MM-dd');
    return attendanceRecords.filter(r => r.date === formattedDate);
  }, [selectedDay, attendanceRecords]);

  const getBadgeVariant = (status: 'attended' | 'missed' | 'off') => {
    switch (status) {
      case 'attended': return 'default';
      case 'missed': return 'destructive';
      case 'off': return 'secondary';
    }
  };

  const handleMarkAttendanceClick = () => {
    setEditingAttendanceRecord(null); // Clear any previous editing state
    setIsMarkAttendanceDialogOpen(true);
  };

  const handleEditAttendanceClick = (record: AttendanceRecord) => {
    setEditingAttendanceRecord(record);
    setIsMarkAttendanceDialogOpen(true);
  };

  const isLoading = isLoadingAttendance || isLoadingSubjects;

  return (
    <div className="max-w-7xl mx-auto">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Attendance Calendar</h1>
          <p className="text-muted-foreground">View and manage your attendance history.</p>
        </div>
        {selectedDay && subjects && subjects.length > 0 && (
          <Button onClick={handleMarkAttendanceClick}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Mark Attendance for {format(selectedDay, 'MMM d')}
          </Button>
        )}
      </header>

      {isLoading ? (
        <div className="grid md:grid-cols-3 gap-6">
          <Skeleton className="h-80 w-full md:col-span-2" />
          <Skeleton className="h-80 w-full" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <Calendar
              mode="single"
              selected={selectedDay}
              onSelect={setSelectedDay}
              className="rounded-md border"
              modifiers={{ attended: attendedDays, missed: missedDays, off: offDays }}
              modifiersClassNames={{
                attended: 'bg-green-500 text-white',
                missed: 'bg-red-500 text-white',
                off: 'bg-slate-500 text-white',
              }}
            />
          </div>
          <div>
            <Card>
              <CardHeader>
                <CardTitle>
                  Details for {selectedDay ? format(selectedDay, 'PPP') : '...'}
                </CardTitle>
                <CardDescription>Records for the selected day.</CardDescription>
              </CardHeader>
              <CardContent>
                {recordsForSelectedDay.length > 0 ? (
                  <ul className="space-y-3">
                    {recordsForSelectedDay.map(record => (
                      <li key={record.id} className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{record.subjects.name}</span>
                          <Badge variant={getBadgeVariant(record.status)} className="capitalize">
                            {record.status}
                          </Badge>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleEditAttendanceClick(record)}>
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit attendance</span>
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No records for this day.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {selectedDay && subjects && (
        <MarkAttendanceDialog
          open={isMarkAttendanceDialogOpen}
          onOpenChange={setIsMarkAttendanceDialogOpen}
          selectedDate={selectedDay}
          subjects={subjects}
          existingRecord={editingAttendanceRecord}
        />
      )}
    </div>
  );
};

export default CalendarPage;