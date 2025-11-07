/**
 * Supabase (server-only) con Service Role Key.
 * No importes este archivo en componentes cliente.
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!url || !serviceKey) {
  throw new Error("Faltan SUPABASE envs (URL o SERVICE_ROLE_KEY)");
}

export const supabaseServer = createClient(url, serviceKey, {
  auth: { persistSession: false },
});
