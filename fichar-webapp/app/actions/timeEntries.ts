"use server";

import { revalidatePath } from "next/cache";
import { clockRequestSchema } from "@/lib/schemas/clock";
import { requireAuth } from "@/lib/auth";
import { processClockEvent } from "@/lib/clockEvents";
import { logActionError } from "@/lib/logger";
import { notifySlack } from "@/lib/notifications";

const REVALIDATE_PATHS = ["/dashboard", "/kiosco", "/equipo", "/incidencias"];

export async function registerCheck(input: unknown) {
  const parsed = clockRequestSchema.parse(input);
  try {
    const { supabase, profile } = await requireAuth(["worker", "manager", "admin", "owner"]);

    await processClockEvent({
      supabase,
      profile: {
        id: profile.id,
        company_id: profile.company_id,
        role: profile.role,
      },
      action: parsed.type,
      payload: {
        employeeId: parsed.employeeId,
        deviceId: parsed.deviceId ?? null,
        latitude: parsed.latitude ?? null,
        longitude: parsed.longitude ?? null,
        notes: parsed.notes ?? null,
        photoUrl: parsed.photoUrl ?? null,
        source: parsed.source ?? undefined,
      },
    });

    await Promise.all(REVALIDATE_PATHS.map((path) => revalidatePath(path)));

    notifySlack(`🕒 ${profile.full_name ?? "Empleado"} registró ${parsed.type} (${parsed.source ?? "web"})`).catch(
      (error) => logActionError("timeEntries:notifySlack", error)
    );

    return { success: true };
  } catch (error) {
    logActionError("timeEntries:registerCheck", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "No se pudo registrar el fichaje",
    };
  }
}
