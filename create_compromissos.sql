-- Script para criar compromissos de retoque para os agendamentos
-- Executa no Supabase SQL Editor

INSERT INTO commitments (title, description, status, urgency, due_date, type, patient_id, procedure_id, is_future, sort_order, created_at)
SELECT
  'Recorrência: Toxina Botulínica (aplicação padrão) - ' || p.name,
  '',
  'pending',
  'medium',
  a.date,
  'recurrence',
  a.patient_id,
  a.service_id,
  true,
  100,
  NOW()
FROM appointments a
JOIN patients p ON a.patient_id = p.id
WHERE a.date IN (
  '2026-08-21', '2026-08-27', '2026-09-09', '2026-09-13',
  '2026-09-19', '2026-09-21', '2026-09-25', '2026-09-30'
)
AND a.service_id = 1
AND a.status = 'scheduled'
ON CONFLICT DO NOTHING;
