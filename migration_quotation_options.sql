-- Migration: Quotation Options Support
-- Run this in Supabase SQL Editor

ALTER TABLE quotation_items ADD COLUMN IF NOT EXISTS option_group integer DEFAULT 0;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS option_configs jsonb DEFAULT '[]'::jsonb;
