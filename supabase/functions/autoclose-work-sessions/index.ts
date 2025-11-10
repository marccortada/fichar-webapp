import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Supabase proporciona SUPABASE_URL automáticamente, pero si no está disponible, usa la variable personalizada
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? Deno.env.get("PROJECT_URL");
// Service role key debe tener un nombre sin prefijo SUPABASE_
const serviceRoleKey = Deno.env.get("SERVICE_ROLE_KEY");
const maxMinutes = Number(Deno.env.get("AUTO_CLOSE_MAX_MINUTES") ?? 12 * 60);

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("PROJECT_URL y SERVICE_ROLE_KEY son requeridos. Verifica las variables de entorno en Edge Functions > Settings > Secrets");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

type WorkSession = {
  id: string;
  company_id: string;
  employee_id: string;
  started_at: string;
};

async function closeExpiredSessions() {
  const now = new Date();
  const threshold = new Date(now.getTime() - maxMinutes * 60 * 1000).toISOString();

  const { data: sessions, error } = await supabase
    .from("work_sessions")
    .select("id, company_id, employee_id, started_at")
    .eq("status", "open")
    .lt("started_at", threshold)
    .limit(500);

  if (error) throw error;
  const list = sessions ?? [];
  let closed = 0;

  for (const session of list) {
    const startedAt = new Date(session.started_at);
    const minutes = Math.max(0, Math.round((now.getTime() - startedAt.getTime()) / 60000));
    const endedAt = now.toISOString();

    const { error: updateError } = await supabase
      .from("work_sessions")
      .update({
        status: "auto_closed",
        ended_at,
        effective_minutes: minutes,
        updated_at: endedAt,
      })
      .eq("id", session.id);

    if (updateError) {
      console.error("No se pudo cerrar la sesión", session.id, updateError.message);
      continue;
    }

    const { error: alertError } = await supabase.from("alerts").insert({
      company_id: session.company_id,
      kind: "work_session_auto_closed",
      severity: "warning",
      entity_ref: session.id,
      payload: {
        auto_closed_at: endedAt,
        started_at: session.started_at,
        minutes,
      },
    });

    if (alertError) {
      console.error("No se pudo registrar alerta", session.id, alertError.message);
    }

    closed += 1;
  }

  return { closed };
}

Deno.serve(async () => {
  try {
    const result = await closeExpiredSessions();
    return new Response(JSON.stringify({ ok: true, ...result }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
