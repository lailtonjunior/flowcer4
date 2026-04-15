-- =====================================================================
-- Agenda CER4 — Schema inicial
-- =====================================================================

create extension if not exists "pgcrypto";
create extension if not exists "btree_gist";

-- ---------- ENUMS ----------
do $$ begin
  create type appointment_status as enum (
    'scheduled',
    'confirmed',
    'completed',
    'cancelled',
    'no_show',
    'blocked'
  );
exception when duplicate_object then null; end $$;

-- ---------- TABELAS ----------

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.professionals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  specialty text not null,
  display_color text not null default '#1F8A8F',
  room text,
  default_appointment_minutes int not null default 50 check (default_appointment_minutes between 5 and 480),
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  spp text not null unique,
  name text not null,
  birth_date date,
  guardian_name text,
  phone text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.professional_weekly_availability (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professionals(id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  slot_minutes int not null default 50 check (slot_minutes between 5 and 480),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_time > start_time)
);

create index if not exists idx_availability_professional on public.professional_weekly_availability(professional_id, weekday);

create table if not exists public.professional_blocks (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professionals(id) on delete cascade,
  block_date date,
  weekday smallint check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  reason text,
  recurring boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_time > start_time),
  check (
    (recurring = true and weekday is not null and block_date is null)
    or (recurring = false and block_date is not null)
  )
);

create index if not exists idx_blocks_professional_date on public.professional_blocks(professional_id, block_date);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professionals(id) on delete restrict,
  patient_id uuid references public.patients(id) on delete set null,
  appointment_date date not null,
  start_time time not null,
  end_time time not null,
  status appointment_status not null default 'scheduled',
  source text default 'admin',
  notes text,
  created_by uuid references public.admin_users(id) on delete set null,
  updated_by uuid references public.admin_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_time > start_time)
);

create index if not exists idx_appt_pro_date on public.appointments(professional_id, appointment_date, start_time);
create index if not exists idx_appt_date on public.appointments(appointment_date);
create index if not exists idx_appt_status on public.appointments(status);

-- Coluna gerada com tsrange (em data + horário) para EXCLUDE constraint
alter table public.appointments
  add column if not exists time_range tsrange
  generated always as (
    tsrange(
      appointment_date + start_time,
      appointment_date + end_time,
      '[)'
    )
  ) stored;

-- Impede sobreposição de horários ativos do mesmo profissional
do $$ begin
  alter table public.appointments
    add constraint appointments_no_overlap
    exclude using gist (
      professional_id with =,
      time_range with &&
    )
    where (status in ('scheduled', 'confirmed', 'blocked'));
exception when duplicate_object then null; end $$;

create table if not exists public.appointment_audit_logs (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null,
  action_type text not null check (action_type in ('insert', 'update', 'delete')),
  previous_data jsonb,
  new_data jsonb,
  performed_by uuid references public.admin_users(id) on delete set null,
  performed_at timestamptz not null default now()
);

create index if not exists idx_audit_appointment on public.appointment_audit_logs(appointment_id, performed_at desc);
