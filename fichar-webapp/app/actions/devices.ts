"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { logActionError } from "@/lib/logger";

const deviceSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(3),
  type: z.enum(["kiosk", "tablet", "mobile"]).default("kiosk"),
  identifier: z.string().min(3),
  location: z.string().optional().nullable(),
  latitude: z.coerce.number().optional().nullable(),
  longitude: z.coerce.number().optional().nullable(),
});

export async function upsertDevice(input: z.input<typeof deviceSchema>) {
  const payload = deviceSchema.parse(input);
  try {
    const { supabase, profile } = await requireAuth(["owner", "admin"]);
    const locationLabel =
      payload.location ??
      (payload.latitude && payload.longitude ? `${payload.latitude},${payload.longitude}` : null);
    const data = {
      company_id: profile.company_id,
      name: payload.name,
      type: payload.type,
      identifier: payload.identifier,
      location: locationLabel,
    };
    const query = supabase.from("devices");
    const result = payload.id ? await query.update(data).eq("id", payload.id) : await query.insert(data);
    const { error } = result;
    if (error) throw new Error(error.message);
    revalidatePath("/configuracion");
    return { success: true };
  } catch (error) {
    logActionError("devices:upsert", error);
    return { success: false, message: error instanceof Error ? error.message : "Error guardando dispositivo" };
  }
}

export async function deleteDevice(id: string) {
  try {
    const { supabase, profile } = await requireAuth(["owner", "admin"]);
    const { error } = await supabase.from("devices").delete().eq("id", id).eq("company_id", profile.company_id);
    if (error) throw new Error(error.message);
    revalidatePath("/configuracion");
    return { success: true };
  } catch (error) {
    logActionError("devices:delete", error);
    return { success: false, message: error instanceof Error ? error.message : "Error eliminando dispositivo" };
  }
}

const deviceTokenSchema = z.object({
  deviceId: z.string().uuid(),
  userId: z.string().uuid().optional(),
  ttlSeconds: z.number().int().min(30).max(600).default(60),
});

export async function requestDeviceToken(input: z.input<typeof deviceTokenSchema>) {
  const payload = deviceTokenSchema.parse(input);
  try {
    const { supabase, profile } = await requireAuth(["owner", "admin", "manager"]);
    const { data: device, error: deviceError } = await supabase
      .from("devices")
      .select("id, company_id")
      .eq("id", payload.deviceId)
      .single();

    if (deviceError || !device || device.company_id !== profile.company_id) {
      throw new Error("No se encontró el dispositivo en tu empresa.");
    }

    const token = randomBytes(16).toString("hex");
    const expiresAt = new Date(Date.now() + payload.ttlSeconds * 1000).toISOString();

    const { error } = await supabase.from("device_tokens").insert({
      device_id: payload.deviceId,
      user_id: payload.userId ?? null,
      token,
      expires_at: expiresAt,
    });

    if (error) throw new Error(error.message);

    return { success: true, token, expiresAt };
  } catch (error) {
    logActionError("devices:requestToken", error);
    return { success: false, message: error instanceof Error ? error.message : "Error generando token" };
  }
}
