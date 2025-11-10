"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { logActionError } from "@/lib/logger";
import { notifySlack, notifyEmail } from "@/lib/notifications";

const issueCreateSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional().nullable(),
  severity: z.enum(["low", "medium", "high"]).default("low"),
  related_entry: z.string().uuid().optional().nullable(),
  assignee_id: z.string().uuid().optional().nullable(),
  tags: z.array(z.string()).optional().nullable(),
});

const issueUpdateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["open", "investigating", "resolved", "closed"]).optional(),
  assignee_id: z.string().uuid().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const issueDeleteSchema = z.object({
  id: z.string().uuid(),
});

function revalidateIssueViews() {
  ["/dashboard", "/incidencias"].forEach((path) => revalidatePath(path));
}

export async function createIssue(input: z.input<typeof issueCreateSchema>) {
  const payload = issueCreateSchema.parse(input);
  try {
    const { supabase, profile } = await requireAuth(["owner", "admin", "manager", "worker"]);
    const { error, data } = await supabase
      .from("issues")
      .insert({
        company_id: profile.company_id,
        reporter_id: profile.id,
        ...payload,
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    revalidateIssueViews();

    const message = `🚨 Nueva incidencia (${payload.severity}) por ${profile.full_name}: "${payload.title}"`;
    await notifySlack(message);
    if (profile.company_id) {
      const { data: company } = await supabase.from("companies").select("email").eq("id", profile.company_id).maybeSingle();
      if (company?.email) {
        await notifyEmail(company.email, "Nueva incidencia registrada", `<p>${message}</p>`);
      }
    }

    return { success: true, issueId: data.id };
  } catch (error) {
    logActionError("issues:create", error);
    return { success: false, message: error instanceof Error ? error.message : "Error creando la incidencia" };
  }
}

export async function updateIssue(input: z.input<typeof issueUpdateSchema>) {
  const payload = issueUpdateSchema.parse(input);
  try {
    const { supabase, profile } = await requireAuth(["owner", "admin", "manager"]);
    const update = {
      status: payload.status,
      assignee_id: payload.assignee_id ?? undefined,
      description: payload.notes ?? undefined,
    };

    const { error } = await supabase
      .from("issues")
      .update(update)
      .eq("id", payload.id)
      .eq("company_id", profile.company_id);

    if (error) throw new Error(error.message);
    revalidateIssueViews();
    return { success: true };
  } catch (error) {
    logActionError("issues:update", error);
    return { success: false, message: error instanceof Error ? error.message : "Error actualizando incidencia" };
  }
}

export async function deleteIssue(input: z.input<typeof issueDeleteSchema>) {
  const payload = issueDeleteSchema.parse(input);
  try {
    const { supabase, profile } = await requireAuth(["owner", "admin"]);
    const { error } = await supabase
      .from("issues")
      .delete()
      .eq("id", payload.id)
      .eq("company_id", profile.company_id);
    if (error) throw new Error(error.message);
    revalidateIssueViews();
    return { success: true };
  } catch (error) {
    logActionError("issues:delete", error);
    return { success: false, message: error instanceof Error ? error.message : "Error eliminando incidencia" };
  }
}
