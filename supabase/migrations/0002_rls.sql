-- =====================================================================
-- Agenda CER4 — Row Level Security
-- Política única: somente usuários autenticados que existem em
-- public.admin_users podem ler/escrever. Sem acesso anônimo.
-- =====================================================================

alter table public.admin_users enable row level security;
alter table public.professionals enable row level security;
alter table public.patients enable row level security;
alter table public.professional_weekly_availability enable row level security;
alter table public.professional_blocks enable row level security;
alter table public.appointments enable row level security;
alter table public.appointment_audit_logs enable row level security;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public, auth as $$
  select exists (
    select 1 from public.admin_users
    where auth_user_id = auth.uid()
  );
$$;

-- Helper para policies
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- ---------- admin_users ----------
drop policy if exists "admin_users self read" on public.admin_users;
create policy "admin_users self read"
  on public.admin_users for select
  to authenticated
  using (auth_user_id = auth.uid());

drop policy if exists "admin_users self update" on public.admin_users;
create policy "admin_users self update"
  on public.admin_users for update
  to authenticated
  using (auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid());

-- ---------- helper macro: aplica policy padrão ----------
-- Para demais tabelas, qualquer admin pode CRUD.

-- professionals
drop policy if exists "professionals admin all" on public.professionals;
create policy "professionals admin all"
  on public.professionals for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- patients
drop policy if exists "patients admin all" on public.patients;
create policy "patients admin all"
  on public.patients for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- weekly availability
drop policy if exists "availability admin all" on public.professional_weekly_availability;
create policy "availability admin all"
  on public.professional_weekly_availability for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- blocks
drop policy if exists "blocks admin all" on public.professional_blocks;
create policy "blocks admin all"
  on public.professional_blocks for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- appointments
drop policy if exists "appointments admin all" on public.appointments;
create policy "appointments admin all"
  on public.appointments for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- audit logs (somente leitura)
drop policy if exists "audit admin read" on public.appointment_audit_logs;
create policy "audit admin read"
  on public.appointment_audit_logs for select
  to authenticated
  using (public.is_admin());
