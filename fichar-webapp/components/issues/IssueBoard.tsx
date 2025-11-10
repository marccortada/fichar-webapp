"use client";

import { useState, useTransition } from "react";
import { createIssue, updateIssue, deleteIssue } from "@/app/actions/issues";
import { useToast } from "@/components/ToastProvider";

type Issue = {
  id: string;
  title: string;
  severity: Severity;
  status: IssueStatus;
  created_at: string;
  assignee_id: string | null;
};

type Employee = { id: string; full_name: string; role: string };

type Severity = "low" | "medium" | "high";
type IssueStatus = "open" | "investigating" | "resolved" | "closed";

const severityOptions = [
  { value: "low", label: "Baja" },
  { value: "medium", label: "Media" },
  { value: "high", label: "Alta" },
];

const statusOptions = [
  { value: "open", label: "Abierta" },
  { value: "investigating", label: "Investigando" },
  { value: "resolved", label: "Resuelta" },
  { value: "closed", label: "Cerrada" },
];

export function IssueBoard({ issues, employees }: { issues: Issue[]; employees: Employee[] }) {
  const [list, setList] = useState(issues);
  const [form, setForm] = useState<{ title: string; description: string; severity: Severity; assignee_id: string }>({
    title: "",
    description: "",
    severity: "low",
    assignee_id: "",
  });
  const [pending, startTransition] = useTransition();
  const { showToast } = useToast();

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startTransition(async () => {
      const result = await createIssue({
        title: form.title,
        description: form.description,
        severity: form.severity,
        assignee_id: form.assignee_id || null,
      });
      if (!result.success) {
        showToast({ title: "No se pudo crear la incidencia", description: result.message, variant: "error" });
        return;
      }
      setList((prev) => [
        {
          id: result.issueId as string,
          title: form.title,
          severity: form.severity,
          status: "open" as IssueStatus,
          created_at: new Date().toISOString(),
          assignee_id: form.assignee_id || null,
        },
        ...prev,
      ]);
      showToast({ title: "Incidencia registrada", variant: "success" });
      setForm({ title: "", description: "", severity: "low", assignee_id: "" });
    });
  };

  const handleStatusChange = (issue: Issue, nextStatus: IssueStatus) => {
    startTransition(async () => {
      const result = await updateIssue({ id: issue.id, status: nextStatus as IssueStatus });
      if (!result.success) {
        showToast({ title: "Error al actualizar", description: result.message, variant: "error" });
        return;
      }
      setList((prev) => prev.map((item) => (item.id === issue.id ? { ...item, status: nextStatus } : item)));
      showToast({ title: "Estado actualizado", variant: "success" });
    });
  };

  const handleDelete = (issue: Issue) => {
    startTransition(async () => {
      const result = await deleteIssue({ id: issue.id });
      if (!result.success) {
        showToast({ title: "No se pudo eliminar", description: result.message, variant: "error" });
        return;
      }
      setList((prev) => prev.filter((item) => item.id !== issue.id));
      showToast({ title: "Incidencia eliminada", variant: "info" });
    });
  };

  return (
    <section className="grid two-columns">
      <form className="card invite-form" onSubmit={handleCreate}>
        <div>
          <p className="card-eyebrow">Crear incidencia</p>
          <h3>Registrar nueva alerta</h3>
        </div>
        <label>
          Título
          <input value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} required placeholder="Ej. Retraso en fichaje" />
        </label>
        <label>
          Descripción
          <input value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} placeholder="Detalles opcionales" />
        </label>
        <label>
          Severidad
          <select value={form.severity} onChange={(e) => setForm((prev) => ({ ...prev, severity: e.target.value as Severity }))}>
            {severityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Responsable
          <select value={form.assignee_id} onChange={(e) => setForm((prev) => ({ ...prev, assignee_id: e.target.value }))}>
            <option value="">Sin asignar</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.full_name}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="primary" disabled={pending}>
          {pending ? "Guardando..." : "Crear incidencia"}
        </button>
      </form>

      <article className="card">
        <div className="card-header">
          <div>
            <p className="card-eyebrow">Incidencias recientes</p>
            <h3>{list.length} abiertas</h3>
          </div>
        </div>
        <ul className="team-list">
          {list.length === 0 && <p className="activity-note">Todo tranquilo por aquí.</p>}
          {list.map((issue) => (
            <li key={issue.id}>
              <div>
                <p className="team-name">{issue.title}</p>
                <p className="team-role">
                  {new Date(issue.created_at).toLocaleString("es-ES")} · {issue.severity}
                </p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <select
                  value={issue.status}
                  onChange={(e) => handleStatusChange(issue, e.target.value as IssueStatus)}
                  aria-label={`Cambiar estado de ${issue.title}`}
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <button className="ghost small" onClick={() => handleDelete(issue)} aria-label={`Eliminar ${issue.title}`}>
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      </article>
    </section>
  );
}
