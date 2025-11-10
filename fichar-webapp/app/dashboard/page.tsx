export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/getSession";
import { createSupabaseServerClient } from "@/lib/supabaseServerClient";
import { AppShell } from "@/components/AppShell";
import { SmartCheckForm } from "@/components/checkin/SmartCheckForm";

type MetricCard = { label: string; value: string; trend: string };

type ActivityRow = {
  entry_id: string;
  employee_name: string;
  entry_type: string;
  check_in: string;
  check_out: string | null;
  notes: string | null;
};

type TeamMember = {
  employee_id: string;
  employee_name: string;
  status: string;
  last_check: string | null;
  in_office: boolean;
};

type ScheduleRow = {
  id: string;
  name: string;
  monday_start: string | null;
  monday_end: string | null;
  tuesday_start: string | null;
  tuesday_end: string | null;
};

type IssueRow = {
  id: string;
  title: string;
  severity: string;
  status: string;
  created_at: string;
  assignee_id: string | null;
};

export default async function DashboardPage() {
  const auth = await getSession();
  if (!auth) {
    redirect("/login");
  }

  const supabase = await createSupabaseServerClient();
  const companyId = auth.profile.company_id;

  const [
    { data: company },
    { data: metricsRows },
    { data: activityRows },
    { data: teamRows },
    { data: schedulesRows },
    { data: issuesRows },
  ] = companyId
    ? await Promise.all([
        supabase.from("companies").select("id, name, email, plan").eq("id", companyId).single(),
        supabase.rpc("get_daily_metrics", { p_company: companyId }),
        supabase.rpc("get_recent_activity", { p_company: companyId, p_limit: 6 }),
        supabase.rpc("get_team_status", { p_company: companyId }),
        supabase.from("schedules").select("id, name, monday_start, monday_end, tuesday_start, tuesday_end").eq("company_id", companyId),
        supabase.from("issues").select("id, title, severity, status, created_at, assignee_id").eq("company_id", companyId).order("created_at", { ascending: false }).limit(5),
      ])
    : [{ data: null }, { data: [] }, { data: [] }, { data: [] }, { data: [] }, { data: [] }];

  const metricsRow = metricsRows?.[0];
  const metrics: MetricCard[] = [
    {
      label: "Entradas de hoy",
      value: metricsRow ? String(metricsRow.check_ins ?? 0) : "0",
      trend: metricsRow ? `${metricsRow.total_minutes ?? 0} min trabajados` : "Sin datos",
    },
    {
      label: "Salidas registradas",
      value: metricsRow ? String(metricsRow.check_outs ?? 0) : "0",
      trend: metricsRow && metricsRow.check_outs ? "Turnos cerrados" : "Pendiente de cierre",
    },
    {
      label: "Incidencias abiertas",
      value: metricsRow ? String(metricsRow.open_issues ?? 0) : "0",
      trend: metricsRow && metricsRow.open_issues ? "Requieren atención" : "Sin incidencias",
    },
  ];

  const activity: ActivityRow[] = (activityRows as ActivityRow[]) ?? [];
  const team: TeamMember[] = (teamRows as TeamMember[]) ?? [];
  const schedules: ScheduleRow[] = (schedulesRows as ScheduleRow[]) ?? [];
  const issues: IssueRow[] = (issuesRows as IssueRow[]) ?? [];

  return (
    <AppShell auth={auth} company={company} activePath="/dashboard">
      <header className="main-header">
        <div>
          <p className="header-eyebrow">Panel en tiempo real</p>
          <h1>{company?.name ?? "Configura tu compañía"}</h1>
          <p className="header-subtitle">
            {company
              ? "Monitorea fichajes, turnos e incidencias en un solo lugar."
              : "Asocia tu usuario a una empresa para empezar a fichar."}
          </p>
        </div>
        <div className="header-meta">
          <div>
            <p className="meta-label">Usuario</p>
            <p className="meta-value">{auth.profile.full_name}</p>
          </div>
          <div>
            <p className="meta-label">Plan</p>
            <p className="meta-value">{company?.plan ?? "—"}</p>
          </div>
        </div>
      </header>

      <div className="card highlight">
        <div>
          <p className="card-eyebrow">Registro express</p>
          <h2>Fichá entradas y salidas en segundos</h2>
          <p className="card-description">
            Capturamos ubicación, foto y dispositivo para auditorías completas. Si llegas tarde avisamos por Slack y correo.
          </p>
        </div>
        <SmartCheckForm />
      </div>

      <section className="grid metrics-grid">
        {metrics.map((metric) => (
          <article key={metric.label} className="card">
            <p className="card-label">{metric.label}</p>
            <p className="card-value">{metric.value}</p>
            <p className="card-trend">{metric.trend}</p>
          </article>
        ))}
      </section>

      <section className="grid two-columns">
        <article className="card activity-card">
          <div className="card-header">
            <div>
              <p className="card-eyebrow">Actividad reciente</p>
              <h3>Fichajes de hoy</h3>
            </div>
            <span className="badge">{activity.length}</span>
          </div>
          <ul className="activity-list">
            {activity.length === 0 && <p className="activity-note">Sin movimientos recientes.</p>}
            {activity.map((item) => (
              <li key={item.entry_id}>
                <div>
                  <p className="activity-name">{item.employee_name}</p>
                  <p className="activity-note">{item.notes ?? "—"}</p>
                </div>
                <div className="activity-meta">
                  <span className={`pill ${item.check_out ? "salida" : "entrada"}`}>
                    {item.check_out ? "Salida" : "Entrada"}
                  </span>
                  <p className="activity-time">
                    {new Date(item.check_in).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </article>

        <article className="card schedule-card">
          <div className="card-header">
            <div>
              <p className="card-eyebrow">Turnos</p>
              <h3>Turnos configurados</h3>
            </div>
            <span className="badge">{schedules.length}</span>
          </div>
          <ul className="schedule-list">
            {schedules.length === 0 && <p className="activity-note">Configura tus turnos para verlos aquí.</p>}
            {schedules.slice(0, 3).map((shift) => (
              <li key={shift.id}>
                <div>
                  <p className="schedule-name">{shift.name}</p>
                  <p className="schedule-shift">Horario estándar</p>
                </div>
                <div className="schedule-meta">
                  <p>
                    {shift.monday_start ?? shift.tuesday_start ?? "--"} — {shift.monday_end ?? shift.tuesday_end ?? "--"}
                  </p>
                  <span className="pill pendiente">Activo</span>
                </div>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="grid two-columns">
        <article className="card">
          <div className="card-header">
            <div>
              <p className="card-eyebrow">Equipo</p>
              <h3>Estado en vivo</h3>
            </div>
          </div>
          <ul className="team-list">
            {team.length === 0 && <p className="activity-note">Aún no hay movimientos de equipo.</p>}
            {team.map((member) => (
              <li key={member.employee_id}>
                <div className="team-info">
                  <span className={`status-dot ${member.in_office ? "online" : "offline"}`} />
                  <div>
                    <p className="team-name">{member.employee_name}</p>
                    <p className="team-role">
                      {member.status} ·{" "}
                      {member.last_check
                        ? new Date(member.last_check).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
                        : "--"}
                    </p>
                  </div>
                </div>
                <p className="team-status">{member.in_office ? "En turno" : "Fuera de turno"}</p>
              </li>
            ))}
          </ul>
        </article>

        <article className="card">
          <div className="card-header">
            <div>
              <p className="card-eyebrow">Incidencias</p>
              <h3>Últimas alertas</h3>
            </div>
          </div>
          <ul className="team-list">
            {issues.length === 0 && <p className="activity-note">Sin incidencias reportadas.</p>}
            {issues.map((issue) => (
              <li key={issue.id}>
                <div>
                  <p className="team-name">{issue.title}</p>
                  <p className="team-role">
                    {new Date(issue.created_at).toLocaleDateString("es-ES")} · {issue.severity}
                  </p>
                </div>
                <span className={`pill ${issue.status === "open" ? "pendiente" : "entrada"}`}>{issue.status}</span>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </AppShell>
  );
}
