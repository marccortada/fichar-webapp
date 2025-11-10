import { SupabaseClient } from "@supabase/supabase-js";

export type ClockAction = "in" | "out" | "break_start" | "break_end";

export type ClockPayload = {
  employeeId?: string;
  deviceId?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  notes?: string | null;
  photoUrl?: string | null;
  source?: "web" | "mobile" | "kiosk";
};

export async function processClockEvent({
  supabase,
  profile,
  action,
  payload,
}: {
  supabase: SupabaseClient<any>;
  profile: { id: string; company_id: string; role: string };
  action: ClockAction;
  payload: ClockPayload;
}) {
  const targetEmployeeId = payload.employeeId ?? profile.id;
  const now = new Date();
  const source = payload.source ?? "web";

  if (profile.role === "worker" && targetEmployeeId !== profile.id) {
    throw new Error("No puedes fichar por otro trabajador.");
  }

  // Billing gate: verificar estado de la empresa
  const { data: company } = await supabase
    .from("companies")
    .select("status, plan")
    .eq("id", profile.company_id)
    .maybeSingle();

  if (company?.status === "suspended") {
    throw new Error("La empresa está suspendida. Contacta con soporte.");
  }

  // Grace: permitir fichajes pero con limitaciones (solo fichajes básicos)
  if (company?.status === "grace") {
    // En grace, permitir fichajes pero no funcionalidades avanzadas
    if (payload.source === "kiosk" && company.plan !== "pro") {
      throw new Error("El modo kiosco requiere un plan activo. Actualiza tu suscripción.");
    }
    // Permitir fichajes básicos pero mostrar advertencia (el banner ya lo maneja)
  }

  // Validación de dispositivo
  if (payload.deviceId) {
    const { data: device } = await supabase
      .from("devices")
      .select("id, company_id, latitude, longitude")
      .eq("id", payload.deviceId)
      .maybeSingle();
    if (!device || device.company_id !== profile.company_id) {
      throw new Error("El dispositivo no pertenece a tu empresa.");
    }

    // Validación de geovalla (si hay coordenadas del dispositivo y del fichaje)
    if (payload.latitude && payload.longitude && device.latitude && device.longitude) {
      const distance = calculateDistance(
        device.latitude,
        device.longitude,
        payload.latitude,
        payload.longitude
      );
      // Radio permitido: 100 metros (ajustable)
      const MAX_DISTANCE_METERS = 100;
      if (distance > MAX_DISTANCE_METERS) {
        throw new Error(
          `Estás fuera del área permitida. Distancia: ${Math.round(distance)}m (máximo: ${MAX_DISTANCE_METERS}m)`
        );
      }
    }
  }

  const typeMap: Record<ClockAction, "IN" | "OUT" | "BREAK_START" | "BREAK_END"> = {
    in: "IN",
    out: "OUT",
    break_start: "BREAK_START",
    break_end: "BREAK_END",
  };

  const eventInsert = {
    company_id: profile.company_id,
    employee_id: targetEmployeeId,
    type: typeMap[action],
    source,
    device_id: payload.deviceId ?? null,
    latitude: payload.latitude ?? null,
    longitude: payload.longitude ?? null,
    notes: payload.notes ?? null,
    photo_url: payload.photoUrl ?? null,
    happened_at: now.toISOString(),
  };

  const { error: eventError } = await supabase.from("time_events").insert(eventInsert);
  if (eventError) throw new Error(eventError.message);

  if (action === "in") {
    const { data: existing } = await supabase
      .from("work_sessions")
      .select("id")
      .eq("company_id", profile.company_id)
      .eq("employee_id", targetEmployeeId)
      .eq("status", "open")
      .maybeSingle();
    if (existing) {
      throw new Error("Ya hay una sesión abierta. Cierra antes de fichar entrada.");
    }
    const { error } = await supabase.from("work_sessions").insert({
      company_id: profile.company_id,
      employee_id: targetEmployeeId,
      started_at: now.toISOString(),
      status: "open",
    });
    if (error) throw new Error(error.message);
  }

  if (action === "out") {
    const { data: session, error: sessionError } = await supabase
      .from("work_sessions")
      .select("id, started_at")
      .eq("company_id", profile.company_id)
      .eq("employee_id", targetEmployeeId)
      .eq("status", "open")
      .single();

    if (sessionError || !session) {
      throw new Error("No hay una sesión abierta para cerrar.");
    }

    const startedAt = new Date(session.started_at);
    const minutes = Math.max(0, Math.round((now.getTime() - startedAt.getTime()) / 60000));

    const { error } = await supabase
      .from("work_sessions")
      .update({
        ended_at: now.toISOString(),
        status: "closed",
        effective_minutes: minutes,
        updated_at: now.toISOString(),
      })
      .eq("id", session.id);

    if (error) throw new Error(error.message);
  }

  return { success: true };
}

/**
 * Calcula la distancia entre dos puntos geográficos usando la fórmula de Haversine
 * @returns Distancia en metros
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Radio de la Tierra en metros
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distancia en metros
}
