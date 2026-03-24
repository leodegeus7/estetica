-- ============================================================
-- Migração: Integração Google Calendar
-- Execute este SQL no Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Novos campos na tabela appointments
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS source text DEFAULT NULL;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS google_event_id text DEFAULT NULL;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS draft_title text DEFAULT NULL;

-- 2. Tornar patient_id e service_id opcionais (necessário para pre-agendamentos)
ALTER TABLE appointments ALTER COLUMN patient_id DROP NOT NULL;
ALTER TABLE appointments ALTER COLUMN service_id DROP NOT NULL;

-- 3. Índice para busca rápida por google_event_id (evita duplicatas)
CREATE UNIQUE INDEX IF NOT EXISTS appointments_google_event_id_key
  ON appointments(google_event_id)
  WHERE google_event_id IS NOT NULL;
