-- =====================================================================
-- Agenda CER4 — Categorização manual de profissionais "Geral"
-- =====================================================================
-- Fonte: .temp/profissionais_por_modalidade.md
-- Atualiza specialty + display_color com base em match por nome
-- (case-insensitive). Só altera quem bate exatamente — o WHERE usa UPPER.
--
-- As cores seguem os tokens canônicos de SPECIALTY_COLORS.
-- =====================================================================

with mapping(name_pattern, specialty, color) as (
  values
    ('ANDRE',             'Educação Física',         '#111827'),
    ('CAMILA',            'Fisioterapia',            '#2563EB'),
    ('CAMILLA',           'Fisioterapia',            '#2563EB'),
    ('CELIA',             'Fisioterapia',            '#2563EB'),
    ('CLAUDIO',           'Ortopedista',             '#475569'),
    ('DANIEL BRAZ',       'Otorrinolaringologista',  '#BE185D'),
    ('DANIEL MEDLIG',     'Oftalmologista',          '#D4A017'),
    ('FRANCISCO',         'Educação Física',         '#111827'),
    ('FRANCISCO LIMA',    'Educação Física',         '#111827'),
    ('IVANEIDE',          'Enfermagem',              '#F59E0B'),
    ('JOSIANE',           'Serviço Social',          '#F472B6'),
    ('JULIANA CORREIA',   'Fisioterapia',            '#2563EB'),
    ('LARISSA',           'Fisioterapia',            '#2563EB'),
    ('LEONARDO',          'Psiquiatra',              '#5B21B6'),
    ('LUIZ',              'Fisioterapia',            '#2563EB'),
    ('MARCOS',            'Fisioterapia',            '#2563EB'),
    ('MARIA CLARA',       'Fisioterapia',            '#2563EB'),
    ('POLIANA',           'Fisioterapia',            '#2563EB'),
    ('POLIANA ALCANTARA', 'Fisioterapia',            '#2563EB'),
    ('REBECA',            'Fisioterapia',            '#2563EB'),
    ('RENATA SOUZA',      'Pedagogia',               '#EA580C'),
    ('SAMUEL',            'Fisioterapia',            '#2563EB'),
    ('TIAGO',             'Fisiatra',                '#1E40AF'),
    ('WALTER',            'Musicoterapia',           '#9333EA')
)
update public.professionals p
   set specialty     = m.specialty,
       display_color = m.color,
       updated_at    = now()
  from mapping m
 where upper(p.name) = m.name_pattern;

-- Log visual (psql exibe o NOTICE): confere quantos foram atualizados
do $$
declare
  v_geral_remaining int;
begin
  select count(*) into v_geral_remaining
    from public.professionals
   where specialty = 'Geral' and is_active = true;
  raise notice 'Profissionais ativos ainda como "Geral": %', v_geral_remaining;
end $$;
