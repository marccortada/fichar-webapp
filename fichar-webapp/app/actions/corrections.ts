"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { logActionError } from "@/lib/logger";

const createSchema = z.object({
  employeeId: z.string().uuid().optional(),
  timeEventId: z.string().uuid().optional(),
  notes: z.string().min(3),
  payload: z.record(z.any()).optional(),
});

const updateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["approved", "rejected"]),
  managerNotes: z.string().optional(),
});

export async function createCorrectionRequest(input: z.input<typeof createSchema>) {
  const payload = createSchema.parse(input);
  try {
    const { supabase, profile } = await requireAuth(["worker", "manager", "admin", "owner"]);
    const employeeId = payload.employeeId ?? profile.id;
    if (profile.role === "worker" && employeeId !== profile.id) {
      throw new Error("No puedes crear correcciones para otro trabajador.");
    }

    const { error } = await supabase.from("correction_requests").insert({
      company_id: profile.company_id,
      employee_id: employeeId,
      submitted_by: profile.id,
      payload: payload.payload ?? {},
      status: "pending",
      reason: payload.notes,
    });

    if (error) throw new Error(error.message);
    revalidatePath("/incidencias");
    return { success: true };
  } catch (error) {
    logActionError("corrections:create", error);
    return { success: false, message: error instanceof Error ? error.message : "Error creando la corrección" };
  }
}

export async function updateCorrectionStatus(input: z.input<typeof updateSchema>) {
  const payload = updateSchema.parse(input);
  try {
    const { supabase, profile } = await requireAuth(["manager", "admin", "owner"]);
    const { error } = await supabase
      .from("correction_requests")
      .update({
        status: payload.status,
        manager_id: profile.id,
        reason: payload.managerNotes ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", payload.id);

    if (error) throw new Error(error.message);
    revalidatePath("/incidencias");
    return { success: true };
  } catch (error) {
    logActionError("corrections:update", error);
    return { success: false, message: error instanceof Error ? error.message : "Error actualizando la corrección" };
  }
}
