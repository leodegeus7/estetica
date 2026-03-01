import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não encontradas. Crie o arquivo .env.local')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

VITE_SUPABASE_URL=https://gpvgbwfighhcbvdzibkp.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdwdmdid2ZpZ2hoY2J2ZHppYmtwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzODU1ODEsImV4cCI6MjA4Nzk2MTU4MX0.eSsCF6XnIIJGJvGZhLL0oCRjDw0CUEy1MvUK7wZoOEA