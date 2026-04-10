-- =====================================================================
-- Agenda CER4 — Triggers de updated_at e auditoria de agendamentos
-- =====================================================================

create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$ declare t text;
begin
  for t in
    select unnest(array[
      'admin_users','professionals','patients',
      'professional_weekly_availability','professional_blocks','appointments'
    ])
  loop
    execute format('drop trigger if exists trg_%I_updated on public.%I;', t, t);
    execute format(
      'create trigger trg_%I_updated before update on public.%I
       for each row execute function public.set_updated_at();',
      t, t
    );
  end loop;
end $$;

-- ---------- Auditoria de appointments ----------
create or replace function public.log_appointment_change() returns trigger
language plpgsql security definer set search_path = public, auth as $$
declare
  v_admin_id uuid;
begin
  select id into v_admin_id from public.admin_users where auth_user_id = auth.uid();

  if (tg_op = 'INSERT') then
    insert into public.appointment_audit_logs(appointment_id, action_type, new_data, performed_by)
    values (new.id, 'insert', to_jsonb(new), v_admin_id);
    return new;
  elsif (tg_op = 'UPDATE') then
    insert into public.appointment_audit_logs(appointment_id, action_type, previous_data, new_data, performed_by)
    values (new.id, 'update', to_jsonb(old), to_jsonb(new), v_admin_id);
    return new;
  elsif (tg_op = 'DELETE') then
    insert into public.appointment_audit_logs(appointment_id, action_type, previous_data, performed_by)
    values (old.id, 'delete', to_jsonb(old), v_admin_id);
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_appointments_audit on public.appointments;
create trigger trg_appointments_audit
  after insert or update or delete on public.appointments
  for each row execute function public.log_appointment_change();
