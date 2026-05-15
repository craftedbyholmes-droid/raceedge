import { createClient } from '@supabase/supabase-js';

// Browser-side client - uses anon key only
const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default supabaseClient;