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
  institutionId?: string;
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
  description?: string;
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
  template_id?: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string;
  status: 'P' | 'F' | 'J' | 'S';
  unit?: string;
  userId: string;
  period?: number;
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
  account_type?: 'personal' | 'institutional';
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

// =====================================================
// INSTITUTIONAL MODULE TYPES
// =====================================================

export type CalculationType = 'simple_average' | 'weighted_average' | 'total_sum' | 'custom_formula';
export type RoundingMode = 'none' | 'half_up' | 'floor' | 'ceiling';
export type TeacherRole = 'admin' | 'coordinator' | 'teacher';
export type TeacherStatus = 'pending' | 'active' | 'inactive';

export interface GradeComponent {
  id: string;
  name: string;           // e.g., 'Qualitativo', 'Teste', 'Prova', 'Projeto'
  maxValue: number;       // e.g., 2.0, 3.0, 5.0
  weight: number;         // e.g., 1, 2
  variable: string;       // e.g., 'Q', 'T', 'P', 'PJ' - auto-generated
  isDefault: boolean;     // true for Qualitativo, Teste, Prova
  order: number;          // display order
}

export interface UnitConfig {
  id: string;
  number: number;         // 1, 2, 3, 4
  name: string;           // '1ª Unidade', '2ª Unidade'
  startDate?: string;
  endDate?: string;
  components: GradeComponent[];
  totalPoints: number;    // calculated from components
}

export interface FinalExamConfig {
  enabled: boolean;
  triggerType: 'below_average' | 'points_needed';
  triggerValue: number;   // e.g., 6.0 (average) or points needed
  maxValue: number;       // e.g., 10.0
  minScoreToPass: number; // e.g., 5.0 (min score on final to pass)
  finalFormula?: string;  // e.g., '(average + final_grade) / 2'
}

export interface RecoveryConfig {
  enabled: boolean;
  clearPreviousGrades: boolean;  // zera notas anteriores?
  minScore: number;       // e.g., 0.0
  maxScore: number;       // e.g., 6.0 (max for recovery)
  allowedAttempts: number;
}

export interface ApprovalConfig {
  passingGrade: number;   // e.g., 6.0
  council: {
    enabled: boolean;
    maxBonus: number;     // max bonus points from council
  };
}

export interface GradingConfig {
  calculationType: CalculationType;
  roundingMode: RoundingMode;
  roundingDecimals: number;       // 0, 1, or 2
  units: UnitConfig[];
  approval: ApprovalConfig;
  finalExam: FinalExamConfig;
  recovery: RecoveryConfig;
  customFormula?: string;         // for custom_formula type
}

export interface InstitutionSettings {
  modules: string[];              // enabled modules
  gps_tolerance: number;          // GPS tolerance in meters
  grading_config?: GradingConfig;
  planning_template?: PlanningTemplate;
}

export interface Institution {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
  settings: InstitutionSettings;
  geo_perimeters?: GeoPerimeter[];
  logo_url?: string;
}

export interface GeoPerimeter {
  id: string;
  name: string;           // e.g., 'Campus Principal', 'Quadra'
  center: { lat: number; lng: number };
  radius: number;         // meters
}

export interface InstitutionTeacher {
  id: string;
  institution_id: string;
  user_id: string;
  role: TeacherRole;
  status: TeacherStatus;
  disciplines?: string[];
  joined_at: string;
  // Joined user data
  user?: {
    name: string;
    email: string;
    photo_url?: string;
  };
}

export interface InstitutionClass {
  id: string;
  institution_id: string;
  name: string;           // e.g., '6º Ano A'
  series: string;         // e.g., '6º Ano'
  section: string;        // e.g., 'A'
  year: number;           // academic year
  shift: 'morning' | 'afternoon' | 'evening';
}

export interface InstitutionStudent {
  id: string;
  institution_id: string;
  class_id: string;
  name: string;
  number: string;
  birth_date?: string;
  photo_url?: string;
  inclusion?: {
    type: string;          // free text
    maxApprovalGrade: number;  // max grade for approval (e.g., 6.0)
    observations?: string;
  };
}

export interface PlanningTemplateElement {
  id: string;
  name: string;           // e.g., 'Objetivos', 'Competências BNCC'
  type: 'text' | 'textarea' | 'date' | 'multiselect';
  required: boolean;
  order: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  locked?: boolean;
}

export interface PlanningTemplate {
  id: string;
  name: string;
  version: number;
  created_at: string;
  elements: PlanningTemplateElement[];
  orientation?: 'portrait' | 'landscape';
  background_url?: string; // Preview image or background for canvas
  type?: 'pdf' | 'docx' | 'blank' | 'file'; // 'file' means just a download/upload flow
  file_url?: string; // The original uploaded file path (Template)
  structure_url?: string; // URL to the HTML structure file for editable references
}

export interface StudentOccurrence {
  id: string;
  student_id: string;
  institution_id: string;
  teacher_id: string;
  type: 'positive' | 'negative' | 'neutral';
  category: string;       // e.g., 'Comportamento', 'Atraso', 'Elogio'
  description: string;
  date: string;
  unit?: string;
  // Teacher data for cross-teacher visibility
  teacher?: {
    name: string;
  };
}

export interface PedagogicalReport {
  id: string;
  institution_id: string;
  class_id: string;
  teacher_id: string;
  unit: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface InstitutionEvent {
  id: string;
  institution_id: string;
  title: string;
  description: string;
  start_date: string;
  end_date?: string;
  created_by: string;
  views: EventView[];
}

export interface EventView {
  teacher_id: string;
  viewed_at: string;
  teacher_name?: string;
}