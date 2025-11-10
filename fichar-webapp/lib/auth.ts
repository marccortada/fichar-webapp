import { createSupabaseServerClient } from "./supabaseServerClient";

type AllowedRole = "super_admin" | "owner" | "admin" | "manager" | "worker" | "auditor";

export async function requireAuth(allowedRoles?: AllowedRole[]) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw new Error(`No se pudo leer la sesión: ${sessionError.message}`);
  }

  if (!session) {
    throw new Error("Debes iniciar sesión para realizar esta acción.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, company_id, role, full_name, is_active")
    .eq("id", session.user.id)
    .single();

  if (profileError || !profile) {
    throw new Error("No se encontró un perfil asociado al usuario.");
  }

  if (!profile.is_active) {
    throw new Error("Tu perfil está desactivado. Contacta con un administrador.");
  }

  if (allowedRoles && !allowedRoles.includes(profile.role as AllowedRole)) {
    throw new Error("No tienes permisos para esta acción.");
  }

  if (!profile.company_id) {
    throw new Error("Tu perfil no tiene una empresa asociada.");
  }

  return { supabase, session, profile };
}
