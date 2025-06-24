import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export const TABLES = {
  NOTES: 'notes',
  USERS: 'users'
};

export { supabase };
