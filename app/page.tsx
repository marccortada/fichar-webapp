// Nota: En producción, usa el cliente público `supabase` + sesión de usuario
// para respetar RLS. Aquí usamos `supabaseServer` sólo para test de conectividad.
import { supabaseServer } from "@/lib/supabaseServer";

export default async function Home() {
  const { data, error } = await supabaseServer
    .from("organizations")
    .select("id, name, slug, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <main style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <h1>✅ Conexión Supabase OK</h1>
      {error && (
        <p style={{ color: "crimson" }}>Error: {error.message}</p>
      )}
      {!error && (
        <>
          <p>Organizaciones encontradas: {data?.length ?? 0}</p>
          <pre
            style={{
              background: "#f6f6f6",
              padding: 12,
              borderRadius: 8,
              overflowX: "auto",
            }}
          >
            {JSON.stringify(data ?? [], null, 2)}
          </pre>
          <p style={{ marginTop: 12, opacity: 0.7 }}>
            *Consulta ejecutada en servidor con Service Role (solo para ver
            conectividad). En producción, usa el cliente público + Auth del
            usuario para respetar RLS.
          </p>
        </>
      )}
    </main>
  );
}
