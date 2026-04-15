-- =====================================================================
-- Agenda CER4 — RPC para reordenar profissionais em uma única chamada
-- =====================================================================
-- Antes: 50 profissionais = 50 UPDATEs separados (50 round-trips HTTP).
-- Depois: 1 chamada RPC, 1 UPDATE em massa via unnest com ORDINALITY.
-- =====================================================================

create or replace function public.reorder_professionals(ids uuid[])
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  -- Apenas admins podem reordenar.
  if not exists (
    select 1 from public.admin_users where auth_user_id = auth.uid()
  ) then
    raise exception 'forbidden: only admins can reorder professionals'
      using errcode = '42501';
  end if;

  -- Atualiza em massa: cada id ganha display_order = (posição_no_array * 10).
  -- Múltiplos de 10 deixam "espaço" para inserções pontuais futuras.
  update public.professionals p
     set display_order = ord.position * 10
    from unnest(ids) with ordinality as ord(id, position)
   where p.id = ord.id;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.reorder_professionals(uuid[]) from public;
grant execute on function public.reorder_professionals(uuid[]) to authenticated;
