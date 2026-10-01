import { createClient } from '@supabase/supabase-js'

// Chaque environnement (local, dev, prod) a son propre projet Supabase, défini par des variables
// d'environnement (voir .env.example). La clé "anon" est publique par conception : la sécurité
// vient des règles RLS. Ne mettez JAMAIS la clé "service_role" ici.
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
)
