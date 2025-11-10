export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/getSession";
import { createSupabaseServerClient } from "@/lib/supabaseServerClient";
import { AppShell } from "@/components/AppShell";
import { SettingsForm } from "@/components/settings/SettingsForm";
import { DeviceManager } from "@/components/settings/DeviceManager";

export default async function SettingsPage() {
  const auth = await getSession();
  if (!auth) redirect("/login");

  const supabase = await createSupabaseServerClient();
  const companyId = auth.profile.company_id;

  const [settingsRes, companyRes, devicesRes] = companyId
    ? await Promise.all([
        supabase.from("settings").select("*").eq("company_id", companyId).maybeSingle(),
        supabase.from("companies").select("id, name, plan").eq("id", companyId).single(),
        supabase.from("devices").select("*").eq("company_id", companyId).order("created_at", { ascending: false }),
      ])
    : [{ data: null }, { data: null }, { data: [] }];

  const settings = settingsRes.data;
  const company = companyRes.data;
  const devices = devicesRes.data ?? [];

  return (
    <AppShell auth={auth} company={company} activePath="/configuracion">
      <header className="main-header">
        <div>
          <p className="header-eyebrow">Configuración</p>
          <h1>Preferencias de fichaje</h1>
          <p className="header-subtitle">
            Ajusta las reglas de fichaje, ubicación y tolerancias. Se aplican inmediatamente a todos los dispositivos.
          </p>
        </div>
      </header>
      {companyId ? (
        <>
          <SettingsForm initialSettings={settings} />
          <DeviceManager devices={devices} />
          <div className="card">
            <div className="card-header">
              <div>
                <p className="card-eyebrow">Exportaciones</p>
                <h3>CSV / JSON para terceros</h3>
              </div>
            </div>
            <div className="quick-actions-buttons">
              <a className="ghost" href="/api/export/csv" target="_blank" rel="noreferrer">
                Descargar CSV
              </a>
              <a className="ghost" href="/api/export/json" target="_blank" rel="noreferrer">
                Ver JSON
              </a>
            </div>
            <p className="card-description">
              Integra con tu ERP usando el endpoint REST <code>/api/time-entries?limit=100</code>.
            </p>
          </div>
        </>
      ) : (
        <div className="card">
          <p className="header-eyebrow">Sin compañía</p>
          <h3>No se pueden editar ajustes hasta que pertenezcas a una empresa.</h3>
        </div>
      )}
    </AppShell>
  );
}
