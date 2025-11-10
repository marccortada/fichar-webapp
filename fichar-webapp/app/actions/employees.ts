"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { logActionError } from "@/lib/logger";

const roleEnum = z.enum(["owner", "admin", "manager", "worker", "auditor"]);

const upsertEmployeeSchema = z.object({
  user_id: z.string().uuid(),
  full_name: z.string().min(3),
  role: roleEnum.default("employee"),
  department: z.string().optional().nullable(),
  position: z.string().optional().nullable(),
  employee_code: z.string().optional().nullable(),
});

const updateRoleSchema = z.object({
  user_id: z.string().uuid(),
  role: roleEnum,
});

const toggleActiveSchema = z.object({
  user_id: z.string().uuid(),
  is_active: z.boolean(),
});

function revalidateEmployeeViews() {
  ["/dashboard", "/equipo"].forEach((path) => revalidatePath(path));
}

export async function upsertEmployee(input: z.input<typeof upsertEmployeeSchema>) {
  const payload = upsertEmployeeSchema.parse(input);
  try {
    const { supabase, profile } = await requireAuth(["owner", "admin"]);
    const { error } = await supabase.from("profiles").upsert({
      id: payload.user_id,
      company_id: profile.company_id,
      role: payload.role,
      full_name: payload.full_name,
      department: payload.department,
      position: payload.position,
      employee_code: payload.employee_code,
      is_active: true,
    });

    if (error) throw new Error(error.message);
    revalidateEmployeeViews();
    return { success: true };
  } catch (error) {
    logActionError("employees:upsert", error);
    return { success: false, message: error instanceof Error ? error.message : "Error guardando empleado" };
  }
}

export async function updateEmployeeRole(input: z.input<typeof updateRoleSchema>) {
  const payload = updateRoleSchema.parse(input);
  try {
    const { supabase, profile } = await requireAuth(["owner", "admin"]);
    const { error } = await supabase
      .from("profiles")
      .update({ role: payload.role })
      .eq("id", payload.user_id)
      .eq("company_id", profile.company_id);
    if (error) throw new Error(error.message);
    revalidateEmployeeViews();
    return { success: true };
  } catch (error) {
    logActionError("employees:updateRole", error);
    return { success: false, message: error instanceof Error ? error.message : "Error actualizando rol" };
  }
}

export async function toggleEmployeeActive(input: z.input<typeof toggleActiveSchema>) {
  const payload = toggleActiveSchema.parse(input);
  try {
    const { supabase, profile } = await requireAuth(["owner", "admin"]);
    const { error } = await supabase
      .from("profiles")
      .update({ is_active: payload.is_active })
      .eq("id", payload.user_id)
      .eq("company_id", profile.company_id);
    if (error) throw new Error(error.message);
    revalidateEmployeeViews();
    return { success: true };
  } catch (error) {
    logActionError("employees:toggleActive", error);
    return { success: false, message: error instanceof Error ? error.message : "Error actualizando estado" };
  }
}
