"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { logActionError } from "@/lib/logger";

const scheduleSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres."),
  timezone: z.string().min(2).default("UTC"),
  monday_start: z.string().optional().nullable(),
  monday_end: z.string().optional().nullable(),
  tuesday_start: z.string().optional().nullable(),
  tuesday_end: z.string().optional().nullable(),
  wednesday_start: z.string().optional().nullable(),
  wednesday_end: z.string().optional().nullable(),
  thursday_start: z.string().optional().nullable(),
  thursday_end: z.string().optional().nullable(),
  friday_start: z.string().optional().nullable(),
  friday_end: z.string().optional().nullable(),
  saturday_start: z.string().optional().nullable(),
  saturday_end: z.string().optional().nullable(),
  sunday_start: z.string().optional().nullable(),
  sunday_end: z.string().optional().nullable(),
});

type ScheduleInput = z.input<typeof scheduleSchema>;

const SCHEDULE_REVALIDATE_PATHS = ["/dashboard", "/equipo", "/configuracion"];

function revalidateScheduleViews() {
  SCHEDULE_REVALIDATE_PATHS.forEach((path) => revalidatePath(path));
}

export async function createSchedule(input: ScheduleInput) {
  const payload = scheduleSchema.omit({ id: true }).parse(input);
  try {
    const { supabase, profile } = await requireAuth(["super_admin", "company_admin", "manager"]);
    const { data, error } = await supabase
      .from("schedules")
      .insert({ company_id: profile.company_id, ...payload })
      .select("id")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    revalidateScheduleViews();
    return { success: true, scheduleId: data.id };
  } catch (error) {
    logActionError("schedules:create", error);
    return { success: false, message: error instanceof Error ? error.message : "Error creando el turno" };
  }
}

export async function updateSchedule(input: ScheduleInput) {
  const payload = scheduleSchema.parse(input);
  try {
    const { supabase, profile } = await requireAuth(["super_admin", "company_admin", "manager"]);
    if (!payload.id) throw new Error("Falta el identificador del turno.");

    const { error } = await supabase
      .from("schedules")
      .update(payload)
      .eq("id", payload.id)
      .eq("company_id", profile.company_id);

    if (error) {
      throw new Error(error.message);
    }

    revalidateScheduleViews();
    return { success: true };
  } catch (error) {
    logActionError("schedules:update", error);
    return { success: false, message: error instanceof Error ? error.message : "Error actualizando el turno" };
  }
}

export async function deleteSchedule(id: string) {
  try {
    const { supabase, profile } = await requireAuth(["super_admin", "company_admin"]);
    const { error } = await supabase.from("schedules").delete().eq("id", id).eq("company_id", profile.company_id);
    if (error) throw new Error(error.message);
    revalidateScheduleViews();
    return { success: true };
  } catch (error) {
    logActionError("schedules:delete", error);
    return { success: false, message: error instanceof Error ? error.message : "Error eliminando el turno" };
  }
}
