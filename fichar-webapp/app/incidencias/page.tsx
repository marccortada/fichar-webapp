export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/getSession";
import { createSupabaseServerClient } from "@/lib/supabaseServerClient";
import { AppShell } from "@/components/AppShell";
import { IssueBoard } from "@/components/issues/IssueBoard";

export default async function IssuesPage() {
  const auth = await getSession();
  if (!auth) redirect("/login");

  const supabase = await createSupabaseServerClient();
  const companyId = auth.profile.company_id;

  const [issuesRes, employeesRes, companyRes] = companyId
    ? await Promise.all([
        supabase
          .from("issues")
          .select("id, title, severity, status, created_at, assignee_id, reporter_id")
          .eq("company_id", companyId)
          .order("created_at", { ascending: false }),
        supabase
          .from("profiles")
          .select("id, full_name, role")
          .eq("company_id", companyId)
          .order("full_name", { ascending: true }),
        supabase.from("companies").select("id, name, plan").eq("id", companyId).single(),
      ])
    : [{ data: [] }, { data: [] }, { data: null }];

  const issues = issuesRes.data ?? [];
  const employees = employeesRes.data ?? [];
  const company = companyRes.data;

  return (
    <AppShell auth={auth} company={company} activePath="/incidencias">
      <header className="main-header">
        <div>
          <p className="header-eyebrow">Incidencias</p>
          <h1>Alertas y seguimiento</h1>
          <p className="header-subtitle">
            Registra incidencias, asigna responsables y haz seguimiento del estado en tiempo real.
          </p>
        </div>
      </header>
      {companyId ? (
        <IssueBoard issues={issues} employees={employees} />
      ) : (
        <div className="card">
          <p className="header-eyebrow">Sin compañía</p>
          <h3>Conecta tu usuario a una empresa para gestionar incidencias.</h3>
        </div>
      )}
    </AppShell>
  );
}
