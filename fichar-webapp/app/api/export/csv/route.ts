import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServerClient";
import { getSession } from "@/lib/getSession";

export async function GET() {
  const auth = await getSession();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("time_entries")
    .select("id, user_id, check_in, check_out, notes, entry_type, source, check_in_latitude, check_in_longitude")
    .eq("company_id", auth.profile.company_id)
    .order("check_in", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const header = [
    "id",
    "user_id",
    "check_in",
    "check_out",
    "notes",
    "entry_type",
    "source",
    "check_in_latitude",
    "check_in_longitude",
  ];

  const lines = [
    header.join(","),
    ...(data ?? []).map((row) =>
      header
        .map((key) => {
          const value = (row as Record<string, unknown>)[key];
          if (value === null || value === undefined) return "";
          return `"${String(value).replace(/"/g, '""')}"`;
        })
        .join(",")
    ),
  ];

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="time_entries_${Date.now()}.csv"`,
    },
  });
}
