-- =====================================================================
-- Agenda CER4 — Exclusão em massa de linhas do template
-- =====================================================================
-- Duas RPCs:
--   count_schedule_rows_appointments(ids): retorna o total de
--      agendamentos vinculados a um conjunto de linhas (para mostrar na
--      mensagem única de confirmação).
--   delete_schedule_rows(ids, cascade): apaga N linhas e, opcionalmente,
--      todos os agendamentos (em qualquer data) cujos
--      (professional_id, start_time) batam com as linhas selecionadas —
--      tudo em 1 round-trip + 1 transação no Postgres.
-- =====================================================================

create or replace function public.count_schedule_rows_appointments(ids uuid[])
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(count(a.id), 0)::int
  from public.schedule_template_slots s
  join public.appointments a
    on a.professional_id = s.professional_id
   and a.start_time = s.start_time
  where s.id = any(ids)
    and s.professional_id is not null;
$$;

revoke all on function public.count_schedule_rows_appointments(uuid[]) from public;
grant execute on function public.count_schedule_rows_appointments(uuid[]) to authenticated;


create or replace function public.delete_schedule_rows(
  ids uuid[],
  cascade_appts boolean default false
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  if not exists (
    select 1 from public.admin_users where auth_user_id = auth.uid()
  ) then
    raise exception 'forbidden: only admins can delete schedule rows'
      using errcode = '42501';
  end if;

  if cascade_appts then
    delete from public.appointments a
      using public.schedule_template_slots s
     where s.id = any(ids)
       and s.professional_id is not null
       and a.professional_id = s.professional_id
       and a.start_time = s.start_time;
  end if;

  delete from public.schedule_template_slots where id = any(ids);
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.delete_schedule_rows(uuid[], boolean) from public;
grant execute on function public.delete_schedule_rows(uuid[], boolean) to authenticated;
