import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServerClient";
import { getSession } from "@/lib/getSession";

export async function GET(request: Request) {
  const auth = await getSession();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") ?? 50);

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("time_entries")
    .select("*")
    .eq("company_id", auth.profile.company_id)
    .order("check_in", { ascending: false })
    .limit(limit);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data });
}
