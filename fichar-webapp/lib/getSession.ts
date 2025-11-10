import "server-only";
import { createSupabaseServerClient } from "./supabaseServerClient";

export type SessionWithProfile = {
  session: NonNullable<Awaited<ReturnType<typeof fetchSession>>["session"]>;
  profile: {
    id: string;
    company_id: string | null;
    full_name: string;
    role: string;
  };
};

async function fetchSession() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data;
}

export async function getSession(): Promise<SessionWithProfile | null> {
  const data = await fetchSession();
  const session = data.session;
  if (!session) return null;

  const supabase = await createSupabaseServerClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, company_id, full_name, role")
    .eq("id", session.user.id)
    .maybeSingle();

  if (!profile || error) {
    return {
      session,
      profile: {
        id: session.user.id,
        company_id: null,
        full_name: profile?.full_name ?? session.user.user_metadata.full_name ?? session.user.email ?? "Usuario",
        role: (profile?.role ?? session.user.user_metadata.role ?? "employee") as SessionWithProfile["profile"]["role"],
      },
    };
  }

  return { session, profile };
}
