"use client";

import { useEffect, useState, useTransition } from "react";
import { updateEmployeeRole, toggleEmployeeActive } from "@/app/actions/employees";
import { useToast } from "@/components/ToastProvider";

type Role = "super_admin" | "company_admin" | "manager" | "employee";

type Employee = {
  id: string;
  full_name: string;
  role: Role;
  department: string | null;
  position: string | null;
  employee_code: string | null;
  is_active: boolean;
  created_at: string;
};

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: "super_admin", label: "Super admin" },
  { value: "company_admin", label: "Administrador" },
  { value: "manager", label: "Manager" },
  { value: "employee", label: "Empleado" },
];

export function TeamTable({ employees, currentUserId }: { employees: Employee[]; currentUserId: string }) {
  const [rows, setRows] = useState(employees);
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  useEffect(() => {
    setRows(employees);
  }, [employees]);

  const updateRow = (id: string, update: Partial<Employee>) => {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...update } : row)));
  };

  const handleToggle = (employee: Employee) => {
    if (employee.id === currentUserId) {
      showToast({ title: "Acción no permitida", description: "No puedes desactivar tu propio perfil.", variant: "error" });
      return;
    }
    const nextActive = !employee.is_active;
    updateRow(employee.id, { is_active: nextActive });
    startTransition(async () => {
      const result = await toggleEmployeeActive({ user_id: employee.id, is_active: nextActive });
      if (!result.success) {
        updateRow(employee.id, { is_active: !nextActive });
        showToast({ title: "Error al actualizar", description: result.message, variant: "error" });
      } else {
        showToast({
          title: nextActive ? "Empleado activado" : "Empleado desactivado",
          variant: "success",
        });
      }
    });
  };

  const handleRoleChange = (employee: Employee, nextRole: Role) => {
    if (employee.role === nextRole) return;
    const previousRole = employee.role;
    updateRow(employee.id, { role: nextRole });
    startTransition(async () => {
      const result = await updateEmployeeRole({ user_id: employee.id, role: nextRole as Employee["role"] });
      if (!result.success) {
        updateRow(employee.id, { role: previousRole });
        showToast({ title: "No se pudo cambiar el rol", description: result.message, variant: "error" });
      } else {
        showToast({ title: "Rol actualizado", description: `${employee.full_name} ahora es ${nextRole}.`, variant: "success" });
      }
    });
  };

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <p className="card-eyebrow">Miembros</p>
          <h3>Total: {rows.length}</h3>
        </div>
      </div>
      <div className="team-table">
        <div className="team-table-header">
          <span>Nombre</span>
          <span>Cargo</span>
          <span>Rol</span>
          <span>Estado</span>
          <span />
        </div>
        {rows.map((employee) => (
          <div key={employee.id} className="team-table-row" aria-live="polite">
            <div>
              <p className="team-name">{employee.full_name}</p>
              <p className="team-role">{employee.department ?? "Sin departamento"}</p>
            </div>
            <p>{employee.position ?? "—"}</p>
            <select
              value={employee.role}
              onChange={(event) => handleRoleChange(employee, event.target.value as Role)}
              aria-label={`Cambiar rol de ${employee.full_name}`}
            >
              {ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <span className={`pill ${employee.is_active ? "entrada" : "salida"}`}>
              {employee.is_active ? "Activo" : "Inactivo"}
            </span>
            <button
              className="ghost small"
              onClick={() => handleToggle(employee)}
              disabled={isPending}
              aria-label={employee.is_active ? `Desactivar ${employee.full_name}` : `Activar ${employee.full_name}`}
            >
              {employee.is_active ? "Desactivar" : "Activar"}
            </button>
          </div>
        ))}
        {rows.length === 0 && <p className="activity-note">No hay empleados registrados.</p>}
      </div>
    </div>
  );
}
