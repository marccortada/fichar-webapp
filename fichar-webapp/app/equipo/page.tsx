export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/getSession";
import { createSupabaseServerClient } from "@/lib/supabaseServerClient";
import { AppShell } from "@/components/AppShell";
import { InviteEmployeeForm } from "@/components/team/InviteEmployeeForm";
import { TeamTable } from "@/components/team/TeamTable";

type EmployeeRow = {
  id: string;
  full_name: string;
  role: "super_admin" | "company_admin" | "manager" | "employee";
  department: string | null;
  position: string | null;
  employee_code: string | null;
  is_active: boolean;
  created_at: string;
};

export default async function TeamPage() {
  const auth = await getSession();
  if (!auth) redirect("/login");

  const supabase = await createSupabaseServerClient();
  const companyId = auth.profile.company_id;

  const [employeesRes, companyRes] = companyId
    ? await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, role, department, position, employee_code, is_active, created_at")
          .eq("company_id", companyId)
          .order("full_name", { ascending: true }),
        supabase.from("companies").select("id, name, plan").eq("id", companyId).single(),
      ])
    : [{ data: [] }, { data: null }];

  const employees = (employeesRes.data as EmployeeRow[] | null) ?? [];
  const company = companyRes.data;

  return (
    <AppShell auth={auth} company={company} activePath="/equipo">
      <header className="main-header">
        <div>
          <p className="header-eyebrow">Equipo</p>
          <h1>Personas y roles</h1>
          <p className="header-subtitle">
            Invita a nuevos empleados y gestiona sus permisos. Los cambios se aplican en Supabase al instante.
          </p>
        </div>
      </header>
      {companyId ? (
        <>
          <InviteEmployeeForm />
          <TeamTable employees={employees ?? []} currentUserId={auth.session.user.id} />
        </>
      ) : (
        <div className="card">
          <p className="header-eyebrow">Sin compañía</p>
          <h3>Conecta tu usuario a una empresa para ver el equipo.</h3>
        </div>
      )}
    </AppShell>
  );
}
