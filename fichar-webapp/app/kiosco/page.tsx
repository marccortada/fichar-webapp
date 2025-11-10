export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/getSession";
import { createSupabaseServerClient } from "@/lib/supabaseServerClient";
import { AppShell } from "@/components/AppShell";
import { KioskPanel } from "@/components/kiosk/KioskPanel";

export default async function KioskPage() {
  const auth = await getSession();
  if (!auth) redirect("/login");

  const supabase = await createSupabaseServerClient();
  const company = auth.profile.company_id
    ? (
        await supabase
          .from("companies")
          .select("id, name, plan")
          .eq("id", auth.profile.company_id)
          .single()
      ).data
    : null;

  return (
    <AppShell auth={auth} company={company} activePath="/kiosco">
      <header className="main-header">
        <div>
          <p className="header-eyebrow">Modo kiosco</p>
          <h1>Pantalla táctil</h1>
          <p className="header-subtitle">Pensado para tablets o pantallas de recepción.</p>
        </div>
      </header>
      <KioskPanel />
    </AppShell>
  );
}
