-- =====================================================================
-- Agenda CER4 — Ordem persistida dos profissionais na grade
-- =====================================================================
-- Define a posição de cada profissional na coluna fixa "Profissional/Setor"
-- da agenda. Quem não tem ordem definida cai por último (NULLS LAST) e
-- desempata por nome.
-- =====================================================================

alter table public.professionals
  add column if not exists display_order integer;

create index if not exists idx_professionals_display_order
  on public.professionals(display_order);

-- Inicializa a ordem em múltiplos de 10 (deixa "espaço" entre eles para
-- inserções futuras sem precisar reescrever todos os registros).
with ordered as (
  select id, row_number() over (order by name) * 10 as ord
  from public.professionals
  where display_order is null
)
update public.professionals p
  set display_order = o.ord
  from ordered o
  where p.id = o.id;
