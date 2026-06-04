import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
}

function getSupabaseKeyRole(key) {
  try {
    const payload = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString('utf8'));
    return payload.role;
  } catch {
    return null;
  }
}

if (getSupabaseKeyRole(process.env.SUPABASE_SERVICE_ROLE_KEY) !== 'service_role') {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY must be the secret service_role key, not the anon/public key');
}

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function must(result) {
  if (result.error) throw result.error;
  return result.data;
}
