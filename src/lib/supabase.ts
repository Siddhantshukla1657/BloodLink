// ──────────────────────────────────────────────
//  BloodLink — Supabase Client Singleton
// ──────────────────────────────────────────────
import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL  as string;
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    '[BloodLink] Missing Supabase env vars.\n' +
    'Create a .env.local file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.\n' +
    'See supabase/schema.sql for setup instructions.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);
