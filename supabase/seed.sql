-- =====================================================================
-- Agenda CER4 — Seed de dados de exemplo
-- Rodar APÓS as migrations e APÓS criar o admin (seed_admin.sql)
-- =====================================================================

-- Profissionais
insert into public.professionals (id, name, specialty, display_color, room, default_appointment_minutes, is_active)
values
  ('11111111-1111-1111-1111-111111111101', 'Dra. Ana Lima',     'Psicologia',         '#1F8A8F', 'Sala 1', 50, true),
  ('11111111-1111-1111-1111-111111111102', 'Dr. Bruno Souza',   'Fonoaudiologia',     '#5BD1D7', 'Sala 2', 45, true),
  ('11111111-1111-1111-1111-111111111103', 'Dra. Carla Mendes', 'Terapia Ocupacional','#0B1F3A', 'Sala 3', 50, true),
  ('11111111-1111-1111-1111-111111111104', 'Dr. Diego Rocha',   'Fisioterapia',       '#C9B065', 'Sala 4', 40, true),
  ('11111111-1111-1111-1111-111111111105', 'Dra. Elisa Tavares','Neuropsicologia',    '#176B6F', 'Sala 5', 60, true)
on conflict (id) do nothing;

-- Pacientes (com SPP único)
insert into public.patients (id, spp, name, birth_date, guardian_name, phone)
values
  ('22222222-2222-2222-2222-222222222201', 'SPP-1001', 'Lucas Andrade',     '2015-03-12', 'Mariana Andrade', '(11) 99999-1001'),
  ('22222222-2222-2222-2222-222222222202', 'SPP-1002', 'Sofia Pereira',     '2017-07-04', 'Renata Pereira',  '(11) 99999-1002'),
  ('22222222-2222-2222-2222-222222222203', 'SPP-1003', 'Pedro Henrique',    '2014-11-22', 'Carlos Henrique', '(11) 99999-1003'),
  ('22222222-2222-2222-2222-222222222204', 'SPP-1004', 'Isabela Cardoso',   '2016-05-09', 'Joana Cardoso',   '(11) 99999-1004'),
  ('22222222-2222-2222-2222-222222222205', 'SPP-1005', 'Miguel Ferreira',   '2013-09-18', 'Paulo Ferreira',  '(11) 99999-1005'),
  ('22222222-2222-2222-2222-222222222206', 'SPP-1006', 'Helena Ribeiro',    '2018-01-30', 'Beatriz Ribeiro', '(11) 99999-1006'),
  ('22222222-2222-2222-2222-222222222207', 'SPP-1007', 'Theo Carvalho',     '2015-12-15', 'Fernanda C.',     '(11) 99999-1007'),
  ('22222222-2222-2222-2222-222222222208', 'SPP-1008', 'Alice Monteiro',    '2017-02-26', 'Camila Monteiro', '(11) 99999-1008')
on conflict (spp) do nothing;

-- Disponibilidade semanal: segunda(1)..sexta(5), 08:00-18:00, slot 50min
insert into public.professional_weekly_availability (professional_id, weekday, start_time, end_time, slot_minutes)
select p.id, w.weekday, '08:00'::time, '18:00'::time, p.default_appointment_minutes
from public.professionals p
cross join (values (1),(2),(3),(4),(5)) as w(weekday)
on conflict do nothing;

-- Bloqueio fixo de almoço 12:00-13:00 todos os dias úteis
insert into public.professional_blocks (professional_id, weekday, start_time, end_time, reason, recurring)
select p.id, w.weekday, '12:00'::time, '13:00'::time, 'Almoço', true
from public.professionals p
cross join (values (1),(2),(3),(4),(5)) as w(weekday)
on conflict do nothing;

-- Agendamentos de exemplo para o dia atual
insert into public.appointments (professional_id, patient_id, appointment_date, start_time, end_time, status)
values
  ('11111111-1111-1111-1111-111111111101', '22222222-2222-2222-2222-222222222201', current_date, '08:00', '08:50', 'confirmed'),
  ('11111111-1111-1111-1111-111111111101', '22222222-2222-2222-2222-222222222202', current_date, '09:00', '09:50', 'scheduled'),
  ('11111111-1111-1111-1111-111111111102', '22222222-2222-2222-2222-222222222203', current_date, '08:00', '08:45', 'confirmed'),
  ('11111111-1111-1111-1111-111111111102', '22222222-2222-2222-2222-222222222204', current_date, '09:00', '09:45', 'scheduled'),
  ('11111111-1111-1111-1111-111111111103', '22222222-2222-2222-2222-222222222205', current_date, '10:00', '10:50', 'scheduled'),
  ('11111111-1111-1111-1111-111111111104', '22222222-2222-2222-2222-222222222206', current_date, '11:00', '11:40', 'confirmed'),
  ('11111111-1111-1111-1111-111111111105', '22222222-2222-2222-2222-222222222207', current_date, '14:00', '15:00', 'scheduled'),
  ('11111111-1111-1111-1111-111111111105', '22222222-2222-2222-2222-222222222208', current_date, '15:00', '16:00', 'scheduled')
on conflict do nothing;
