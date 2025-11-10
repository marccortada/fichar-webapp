import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { processClockEvent, ClockAction } from "@/lib/clockEvents";
import { clockPayloadSchema } from "@/lib/schemas/clock";
import { logActionError } from "@/lib/logger";

const ALLOWED_ACTIONS: ClockAction[] = ["in", "out", "break_start", "break_end"];
const REVALIDATE_PATHS = ["/dashboard", "/equipo", "/incidencias", "/kiosco"];

export async function POST(request: Request, { params }: { params: { action: string } }) {
  if (!ALLOWED_ACTIONS.includes(params.action as ClockAction)) {
    return NextResponse.json({ error: "Acción no soportada" }, { status: 404 });
  }

  const supabase = createRouteHandlerClient<any>({ cookies });
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    logActionError("api:clock:getSession", sessionError);
    return NextResponse.json({ error: "No se pudo leer la sesión" }, { status: 500 });
  }

  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, company_id, role, full_name")
    .eq("id", session.user.id)
    .maybeSingle();

  if (profileError || !profile || !profile.company_id) {
    return NextResponse.json({ error: "Perfil inválido" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  let payload;
  try {
    payload = clockPayloadSchema.parse(body);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Payload inválido" },
      { status: 400 }
    );
  }

  try {
    await processClockEvent({
      supabase,
      profile: {
        id: profile.id,
        company_id: profile.company_id,
        role: profile.role,
      },
      action: params.action as ClockAction,
      payload: {
        employeeId: payload.employeeId,
        deviceId: payload.deviceId ?? null,
        latitude: payload.latitude ?? null,
        longitude: payload.longitude ?? null,
        notes: payload.notes ?? null,
        photoUrl: payload.photoUrl ?? null,
        source: payload.source ?? undefined,
      },
    });

    await Promise.all(REVALIDATE_PATHS.map((path) => revalidatePath(path)));

    return NextResponse.json({ success: true });
  } catch (error) {
    logActionError("api:clock", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo registrar el fichaje" },
      { status: 400 }
    );
  }
}
