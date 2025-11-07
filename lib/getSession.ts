import 'server-only';
import { cookies } from 'next/headers';

/**
 * Lee el access token de Supabase desde la cookie `sb-access-token` (si usas
 * `@supabase/auth-helpers-nextjs`). Si no existe, devuelve `null`.
 *
 * Nota: Este helper es server-only. No lo importes en Client Components.
 *
 * Integración más adelante (cuando uses Auth Helpers):
 * - Con `@supabase/auth-helpers-nextjs`, esta cookie la gestiona el helper.
 * - Puedes combinarlo con `supabaseServer.auth.getUser(token)` para obtener el usuario:
 *   ```ts
 *   import { getSessionFromCookie } from '@/lib/getSession';
 *   import { supabaseServer } from '@/lib/supabaseServer';
 *
 *   const token = getSessionFromCookie();
 *   if (token) {
 *     const { data, error } = await supabaseServer.auth.getUser(token);
 *     // data.user contiene el usuario si el token es válido
 *   }
 *   ```
 * - Si aún no usas Auth Helpers, este helper actúa como stub y devolverá `null`.
 */
export function getSessionFromCookie(): string | null {
  const store = cookies();
  const token = store.get('sb-access-token')?.value;
  return token ?? null;
}

