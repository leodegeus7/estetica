-- Migration: Commitments module
-- Run this in Supabase SQL Editor before deploying the code

CREATE TABLE commitments (
  id            serial PRIMARY KEY,
  title         text NOT NULL,
  description   text,
  status        text NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','in_progress','done')),
  urgency       text NOT NULL DEFAULT 'medium'
                  CHECK (urgency IN ('high','medium','low')),
  due_date      date,
  type          text NOT NULL DEFAULT 'custom'
                  CHECK (type IN ('recurrence','birthday','feedback','custom')),
  patient_id    uuid REFERENCES patients(id) ON DELETE SET NULL,
  procedure_id  uuid REFERENCES services(id) ON DELETE SET NULL,
  is_future     boolean NOT NULL DEFAULT false,
  sort_order    int NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  completed_at  timestamptz
);

CREATE INDEX idx_commitments_status    ON commitments(status);
CREATE INDEX idx_commitments_is_future ON commitments(is_future);
CREATE INDEX idx_commitments_patient   ON commitments(patient_id);

CREATE TABLE app_settings (
  id                   int PRIMARY KEY DEFAULT 1,
  commitment_templates jsonb NOT NULL DEFAULT '{}'::jsonb
);

INSERT INTO app_settings (id, commitment_templates) VALUES (1, '{
  "recurrence": "Olá, {patient_name}! 😊 Passando para lembrar que está na hora do seu retorno para {procedure_name}. Podemos agendar?",
  "feedback": "Olá, {patient_name}! Como você está se sentindo após o procedimento de {procedure_name}? 😊",
  "birthday": "Feliz aniversário, {patient_name}! 🎉 A equipe da Clínica Dr. Murilo do Valle deseja um dia maravilhoso!"
}');
