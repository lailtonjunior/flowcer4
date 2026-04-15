-- =====================================================================
-- Agenda CER4 — Template fixo de linhas por horário
-- =====================================================================
-- Cada linha da grade (visível na coluna "Profissional/Setor") é um
-- registro aqui. Define QUEM ocupa QUAL posição em QUAL horário, de forma
-- persistente — vale para todos os dias até alguém alterar/remover.
--
-- A unicidade (start_time, position) garante que não há duas linhas
-- ocupando o mesmo "espaço" da grade.
-- =====================================================================

create table if not exists public.schedule_template_slots (
  id uuid primary key default gen_random_uuid(),
  start_time time not null,
  end_time   time not null,
  position   int  not null,
  professional_id uuid references public.professionals(id) on delete set null,
  is_active  boolean not null default true,
  notes      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_time > start_time),
  check (position > 0),
  unique (start_time, position)
);

create index if not exists idx_schedule_template_start
  on public.schedule_template_slots(start_time, position);
create index if not exists idx_schedule_template_pro
  on public.schedule_template_slots(professional_id);

alter table public.schedule_template_slots enable row level security;

drop policy if exists "schedule_template admin all" on public.schedule_template_slots;
create policy "schedule_template admin all"
  on public.schedule_template_slots for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop trigger if exists trg_schedule_template_updated on public.schedule_template_slots;
create trigger trg_schedule_template_updated
  before update on public.schedule_template_slots
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Seed inicial: cria 1 linha para cada (horário padrão × profissional ativo).
-- Posição respeita display_order do profissional. Idempotente — só roda
-- se a tabela ainda estiver vazia.
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from public.schedule_template_slots) then
    with slots as (
      select unnest(array[
        '07:30','08:10','08:50','09:30','10:10','10:50','11:30','12:10',
        '12:50','13:30','14:10','14:50','15:30','16:10','16:50','17:20'
      ]::time[]) as start_time
    ),
    ordered_pros as (
      select id, row_number() over (order by display_order nulls last, name) as pos
      from public.professionals
      where is_active = true
    )
    insert into public.schedule_template_slots
      (start_time, end_time, professional_id, position)
    select
      s.start_time,
      (s.start_time + interval '40 minutes')::time,
      op.id,
      op.pos
    from slots s
    cross join ordered_pros op
    on conflict (start_time, position) do nothing;
  end if;
end $$;
