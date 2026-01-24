export interface Grades {
  workshop?: number;
  test?: number;
  simulado?: number;
  qualitative?: number;
  exam?: number;
  scienceFair?: number;
  talentShow?: number;
  gincana?: number;
  observation?: string;
  [key: string]: any;
}

export interface ClassConfig {
  id: string;
  name: string;
  sections: string[];
  userId: string;
  subject?: string;
}

export interface Student {
  id: string;
  name: string;
  number: string;
  initials: string;
  color: string;
  classId: string;
  section: string;
  userId: string;
  units: {
    [key: string]: Grades;
  };
}

export interface AttachmentFile {
  id: string;
  name: string;
  size: string;
  url: string;
}

export interface Activity {
  id: string;
  title: string;
  type: string;
  seriesId: string;
  section?: string;
  date: string;
  startDate?: string;
  endDate?: string;
  description: string;
  files: AttachmentFile[];
  completions?: string[];
  userId: string;
  subject?: string;
  createdAt?: string;
}

export interface Plan {
  id: string;
  title: string;
  seriesId: string;
  classId?: string;
  section?: string;
  startDate: string;
  endDate: string;
  description: string;
  files: AttachmentFile[];
  userId: string;
  objectives?: string;
  bncc_codes?: string;
  methodology?: string;
  resources?: string;
  assessment?: string;
  duration?: string;
  theme_area?: string;
  coordinator_name?: string;
  activity_type?: string;
  subject?: string;
  class_name?: string; // Snapshot of class name
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string;
  status: 'P' | 'F' | 'J' | 'S';
  unit?: string;
  userId: string;
}

export interface Occurrence {
  id: string;
  studentId: string;
  type: string;
  description: string;
  date: string;
  userId: string;
  unit?: string;
  student_name?: string;
}

export type Subject =
  | 'Filosofia'
  | 'Educação Física'
  | 'Matemática'
  | 'Física'
  | 'História'
  | 'Geografia'
  | 'Artes'
  | 'Projeto de Vida'
  | 'Literatura'
  | 'Português'
  | 'Redação'
  | 'Química'
  | 'Inglês'
  | 'Ensino Religioso'
  | 'Ciências'
  | 'Biologia'
  | 'Sociologia'
  | 'Espanhol'
  | 'Geral';

export const SUBJECTS: Subject[] = [
  'Filosofia', 'Educação Física', 'Matemática', 'Física', 'História', 'Geografia',
  'Artes', 'Projeto de Vida', 'Literatura', 'Português', 'Redação', 'Química', 'Ciências',
  'Biologia', 'Sociologia', 'Inglês', 'Espanhol', 'Ensino Religioso', 'Geral'
];

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  subject: Subject;
  photoUrl?: string;
  subjects?: string[];
  isPasswordSet?: boolean;
}

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday, 1 = Monday, etc.

export interface ScheduleItem {
  id: string;
  userId: string;
  dayOfWeek: DayOfWeek;
  startTime: string; // Format "HH:mm"
  endTime: string;   // Format "HH:mm"
  classId: string;
  section?: string; // Added to support "Class 1A" vs "Class 1B"
  className?: string; // For display convenience
  subject: string;
  color?: string; // For UI visualization
}