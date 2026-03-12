import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    // Retorna um objeto que não quebra o build, mas avisa sobre a falta de chaves
    console.warn('Supabase credentials missing. Client creation skipped during build.');
    return new Proxy({} as any, {
      get: () => () => ({ data: null, error: new Error('Supabase not initialized') })
    });
  }

  return createBrowserClient(url, anonKey);
}
