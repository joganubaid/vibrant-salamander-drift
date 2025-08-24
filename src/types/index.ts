export type Subject = {
  id: string;
  user_id: string;
  name: string;
  threshold: number;
  color: string;
  created_at: string;
  updated_at: string;
};

export type AttendanceRecord = {
  id: string;
  user_id: string;
  subject_id: string;
  date: string; // YYYY-MM-DD
  status: 'attended' | 'missed' | 'off';
  created_at: string;
  updated_at: string;
};

export type SubjectWithAttendance = Subject & {
  attendance_records: AttendanceRecord[];
};