"use client";

import { useState } from "react";
import { upsertEmployee } from "@/app/actions/employees";
import { useToast } from "@/components/ToastProvider";

const defaultState = {
  user_id: "",
  full_name: "",
  role: "employee",
  department: "",
  position: "",
  employee_code: "",
};

export function InviteEmployeeForm() {
  const [form, setForm] = useState(defaultState);
  const [isSubmitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.user_id || !form.full_name) {
      showToast({ title: "Datos incompletos", description: "Necesitas el UUID del usuario y su nombre.", variant: "error" });
      return;
    }
    setSubmitting(true);
    const result = await upsertEmployee({
      user_id: form.user_id,
      full_name: form.full_name,
      role: form.role as "employee" | "manager" | "company_admin" | "super_admin",
      department: form.department || null,
      position: form.position || null,
      employee_code: form.employee_code || null,
    });
    setSubmitting(false);
    if (!result.success) {
      showToast({ title: "No se pudo guardar", description: result.message, variant: "error" });
      return;
    }
    showToast({ title: "Empleado invitado", description: "Comparte credenciales con el usuario para que inicie sesión.", variant: "success" });
    setForm(defaultState);
  };

  return (
    <form className="card invite-form" onSubmit={handleSubmit}>
      <div>
        <p className="card-eyebrow">Invitar empleado</p>
        <h3>Conecta un usuario existente</h3>
      </div>
      <div className="invite-grid">
        <label>
          UUID del usuario (auth.users)
          <input name="user_id" value={form.user_id} onChange={handleChange} placeholder="c973e1c4-..." required />
        </label>
        <label>
          Nombre completo
          <input name="full_name" value={form.full_name} onChange={handleChange} placeholder="Nombre Apellido" required />
        </label>
        <label>
          Rol
          <select name="role" value={form.role} onChange={handleChange}>
            <option value="employee">Empleado</option>
            <option value="manager">Manager</option>
            <option value="company_admin">Administrador</option>
            <option value="super_admin">Super admin</option>
          </select>
        </label>
        <label>
          Departamento
          <input name="department" value={form.department} onChange={handleChange} placeholder="Operaciones" />
        </label>
        <label>
          Puesto
          <input name="position" value={form.position} onChange={handleChange} placeholder="Responsable" />
        </label>
        <label>
          Código empleado
          <input name="employee_code" value={form.employee_code} onChange={handleChange} placeholder="EMP-001" />
        </label>
      </div>
      <button type="submit" className="primary" disabled={isSubmitting}>
        {isSubmitting ? "Guardando..." : "Guardar empleado"}
      </button>
    </form>
  );
}
