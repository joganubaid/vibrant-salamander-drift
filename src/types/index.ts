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

export type TimetableEntry = {
  id: string;
  user_id: string;
  subject_id: string;
  day_of_week: number; // 0 = Sunday, 6 = Saturday
  start_time: string; // "HH:mm:ss"
  end_time: string; // "HH:mm:ss"
  created_at: string;
};

export type TimetableEntryWithSubject = TimetableEntry & {
  subjects: Pick<Subject, 'name' | 'color'>;
};

export type Classroom = {
  id: string;
  name: string;
  owner_id: string;
  join_code: string;
  created_at: string;
};

export type Enrollment = {
  id: string;
  user_id: string;
  classroom_id: string;
  created_at: string;
};

export type EnrolledClassroom = Classroom & {
  profiles: {
    display_name: string | null;
  }
};

export type OwnedClassroom = Classroom & {
  enrollments: [{ count: number }];
};