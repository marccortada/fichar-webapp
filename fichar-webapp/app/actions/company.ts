"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { logActionError } from "@/lib/logger";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const transferSchema = z.object({
  companyId: z.string().uuid(),
  newOwnerUserId: z.string().uuid(),
});

export async function transferOwnership(data: z.input<typeof transferSchema>) {
  const payload = transferSchema.parse(data);
  try {
    const { supabase, profile } = await requireAuth(["owner"]);
    if (profile.company_id !== payload.companyId) {
      throw new Error("No puedes transferir fuera de tu empresa.");
    }
    if (profile.id === payload.newOwnerUserId) {
      throw new Error("El nuevo propietario debe ser un usuario distinto.");
    }

    const { data: candidate, error: candidateError } = await supabase
      .from("profiles")
      .select("user_id, role")
      .eq("user_id", payload.newOwnerUserId)
      .eq("company_id", profile.company_id)
      .single();

    if (candidateError || !candidate) {
      throw new Error("No se encontró al nuevo propietario en esta empresa.");
    }
    if (candidate.role !== "admin") {
      throw new Error("Solo un administrador puede recibir la titularidad.");
    }

    await supabase.from("companies").update({ owner_user_id: payload.newOwnerUserId }).eq("id", profile.company_id);
    await supabase
      .from("profiles")
      .update({ role: "admin" })
      .eq("user_id", profile.id)
      .eq("company_id", profile.company_id);
    await supabase
      .from("profiles")
      .update({ role: "owner" })
      .eq("user_id", payload.newOwnerUserId)
      .eq("company_id", profile.company_id);

    await Promise.all([
      supabase
        .from("audit_logs")
        .insert({
          company_id: profile.company_id,
          actor_user_id: profile.id,
          action: "transfer_ownership",
          entity_type: "company",
          entity_id: profile.company_id,
          diff: { from: profile.id, to: payload.newOwnerUserId },
        }),
      supabaseAdmin.auth.admin.updateUserById(payload.newOwnerUserId, {
        app_metadata: { role: "owner", company_id: profile.company_id },
      }),
      supabaseAdmin.auth.admin.updateUserById(profile.id, {
        app_metadata: { role: "admin", company_id: profile.company_id },
      }),
    ]);

    revalidatePath("/configuracion");
    return { success: true };
  } catch (error) {
    logActionError("company:transferOwnership", error);
    return { success: false, message: error instanceof Error ? error.message : "Error transfiriendo titularidad" };
  }
}
