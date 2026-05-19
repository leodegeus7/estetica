WITH pacientes_agendamentos AS (
  SELECT DISTINCT
    a.patient_id,
    p.name,
    a.date,
    a.service_id
  FROM appointments a
  JOIN patients p ON a.patient_id = p.id
  WHERE a.date::date IN (
    '2026-08-21'::date, '2026-08-27'::date, '2026-09-09'::date, 
    '2026-09-13'::date, '2026-09-19'::date, '2026-09-21'::date, 
    '2026-09-25'::date, '2026-09-30'::date
  )
  AND a.status = 'scheduled'
)
INSERT INTO commitments (
  title, description, status, urgency, due_date, type, 
  patient_id, procedure_id, is_future, sort_order, created_at
)
SELECT
  'Recorrência: Toxina Botulínica (aplicação padrão) - ' || name,
  '',
  'pending',
  'medium',
  date,
  'recurrence',
  patient_id,
  'c1e6f74a-676a-400b-b7e0-b328f0ab0e94'::uuid,
  true,
  100,
  NOW()
FROM pacientes_agendamentos;
