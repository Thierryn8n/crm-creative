import { createClient } from '@supabase/supabase-js'

// Cliente admin para validar tokens e operações administrativas
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.warn('Supabase admin credentials missing. Admin client creation skipped.');
    return new Proxy({} as any, {
      get: () => () => ({ data: null, error: new Error('Supabase admin not initialized') })
    });
  }

  return createClient(
    url,
    key,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  )
}