-- Migration: Institutional Module (Complete)
-- Status: DRAFT for Approval

-- 1. ENUMS (Para padronização)
create type institution_role_enum as enum ('admin', 'coordinator', 'teacher');
create type attendance_status_enum as enum ('present', 'absent', 'justified', 'pending_validation');

-- 2. CORE: INSTITUTIONS
create table if not exists institutions (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    owner_id uuid references auth.users(id) not null,
    created_at timestamptz default now(),
    settings jsonb default '{"gps_tolerance": 100, "modules": ["attendance", "grades"]}'::jsonb,
    geo_perimeters jsonb[] default array[]::jsonb[] -- [{lat, lng, radius, name}]
);

-- 3. CORE: TEACHERS (Membros)
create table if not exists institution_teachers (
    id uuid default gen_random_uuid() primary key,
    institution_id uuid references institutions(id) on delete cascade not null,
    user_id uuid references auth.users(id) on delete cascade not null,
    role institution_role_enum default 'teacher',
    status text default 'active',
    joined_at timestamptz default now(),
    unique(institution_id, user_id)
);

-- 4. CORE: INVITES
create table if not exists institution_invites (
    id uuid default gen_random_uuid() primary key,
    institution_id uuid references institutions(id) on delete cascade,
    code text unique not null,
    created_by uuid references auth.users(id),
    expires_at timestamptz not null,
    used_at timestamptz,
    used_by uuid references auth.users(id)
);

-- 5. ACADEMIC: CLASSES (Turmas Institucionais)
create table if not exists institutional_classes (
    id uuid default gen_random_uuid() primary key,
    institution_id uuid references institutions(id) on delete cascade not null,
    name text not null, -- "Turma A"
    grade text not null, -- "9º Ano"
    shift text, -- "Matutino"
    created_at timestamptz default now()
);

-- 6. ACADEMIC: SUBJECTS/ATRIBUIÇÃO
create table if not exists class_subjects (
    id uuid default gen_random_uuid() primary key,
    class_id uuid references institutional_classes(id) on delete cascade not null,
    subject_name text not null,
    teacher_id uuid references institution_teachers(id) on delete set null, -- Pode ser null se sem prof
    unique(class_id, subject_name)
);

-- 7. ACADEMIC: STUDENTS (Alunos Institucionais)
create table if not exists institutional_students (
    id uuid default gen_random_uuid() primary key,
    institution_id uuid references institutions(id) on delete cascade not null,
    name text not null,
    registration_number text, -- Matrícula
    created_at timestamptz default now()
);

-- Tabela de ligação N:N (Aluno pode estar em turmas extras?)
-- Para simplificar Fase 1: Aluno pertence a uma turma principal pra fins de chamada
create table if not exists class_enrollments (
    class_id uuid references institutional_classes(id) on delete cascade,
    student_id uuid references institutional_students(id) on delete cascade,
    primary key (class_id, student_id)
);

-- 8. OPERATIONAL: SCHEDULE (Horário)
create table if not exists institution_schedules (
    id uuid default gen_random_uuid() primary key,
    institution_id uuid references institutions(id) on delete cascade,
    teacher_id uuid references institution_teachers(id) on delete cascade,
    weekday integer check (weekday between 0 and 6),
    start_time time not null,
    end_time time not null,
    class_subject_id uuid references class_subjects(id)
);

-- 9. OPERATIONAL: ATTENDANCE (Ponto Professor)
create table if not exists teacher_attendance_records (
    id uuid default gen_random_uuid() primary key,
    institution_id uuid references institutions(id) on delete cascade,
    teacher_id uuid references institution_teachers(id) on delete cascade,
    date date default current_date,
    check_in_time timestamptz,
    check_in_photo_path text,
    check_in_coords point, -- PostGIS point ou simples (lat,lng)
    check_out_time timestamptz,
    check_out_photo_path text,
    status attendance_status_enum default 'pending_validation',
    justification_text text,
    validated_by uuid references auth.users(id) -- Coordenador que validou
);

-- 10. INDEXES (Performance)
create index idx_inst_teachers_user on institution_teachers(user_id);
create index idx_inst_classes_inst on institutional_classes(institution_id);
create index idx_class_subjects_teacher on class_subjects(teacher_id);
create index idx_schedules_teacher_day on institution_schedules(teacher_id, weekday);
create index idx_attendance_date on teacher_attendance_records(date);

-- 11. RLS (Exemplos Básicos - SERÃO EXPANDIDOS NA IMPLEMENTAÇÃO)
alter table institutions enable row level security;
alter table institution_teachers enable row level security;
alter table institutional_classes enable row level security;

-- Policy: Ver dados da minha instituição
create policy "Membros veem dados da escola" on institutional_classes
for select using (
    institution_id in (
        select institution_id from institution_teachers where user_id = auth.uid()
    )
);
