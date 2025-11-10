"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { logActionError } from "@/lib/logger";

const settingsSchema = z.object({
  allow_manual_entries: z.boolean().optional(),
  require_location: z.boolean().optional(),
  lateness_threshold_minutes: z.number().int().min(0).max(180).optional(),
  overtime_threshold_minutes: z.number().int().min(0).max(1440).optional(),
  timezone: z.string().min(2).optional(),
  custom: z.record(z.string(), z.any()).optional(),
});

export async function updateSettings(input: z.input<typeof settingsSchema>) {
  const payload = settingsSchema.parse(input);
  try {
    const { supabase, profile } = await requireAuth(["super_admin", "company_admin"]);
    const { data: existing } = await supabase
      .from("settings")
      .select("id")
      .eq("company_id", profile.company_id)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase.from("settings").update(payload).eq("company_id", profile.company_id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase
        .from("settings")
        .insert({ company_id: profile.company_id, ...payload });
      if (error) throw new Error(error.message);
    }

    ["/dashboard", "/configuracion"].forEach((path) => revalidatePath(path));
    return { success: true };
  } catch (error) {
    logActionError("settings:update", error);
    return { success: false, message: error instanceof Error ? error.message : "Error guardando configuración" };
  }
}
