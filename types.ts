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
  userId: string;
}

export interface Occurrence {
  id: string;
  studentId: string;
  type: string;
  description: string;
  date: string;
  userId: string;
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
  | 'Geral';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  subject: Subject;
  photoUrl?: string;
  subjects?: string[];
}