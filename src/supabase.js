import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não encontradas. Crie o arquivo .env.local')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// Cliente secundário: Finance Manager (transações profissionais do Murilo)
const financeUrl = import.meta.env.VITE_FINANCE_SUPABASE_URL
const financeKey = import.meta.env.VITE_FINANCE_SUPABASE_KEY
export const financeSupabase = financeUrl && financeKey
  ? createClient(financeUrl, financeKey)
  : null
