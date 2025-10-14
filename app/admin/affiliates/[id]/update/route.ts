import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { Database } from "@/types/database";

async function ensureAdmin(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/admin-auth/login', req.url));

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  const typedProfile = profile as Database['public']['Tables']['user_profiles']['Row'] | null;
  if (!typedProfile || typedProfile.role !== 'admin') {
    return NextResponse.redirect(new URL('/', req.url));
  }
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const adminCheck = await ensureAdmin(req);
  if (adminCheck) return adminCheck;

  const { id } = await context.params;
  if (!id) {
    return NextResponse.redirect(new URL("/admin/affiliates?error=missing_id", req.url));
  }

  // Auth already ensured by ensureAdmin

  const service = createServiceClient();
  const form = await req.formData();

  const name = (form.get("name") as string | null) ?? undefined;
  const email = (form.get("email") as string | null) ?? undefined;
  const code = (form.get("code") as string | null) ?? undefined;
  const statusRaw = (form.get("status") as string | null) ?? undefined;
  const visibilityRaw = (form.get("visibility_level") as string | null) ?? undefined;

  type AffiliateUpdate = Database['public']['Tables']['affiliates']['Update'];
  const updatePayload: AffiliateUpdate = {};
  if (name !== undefined) updatePayload.name = name;
  if (email !== undefined) updatePayload.email = email;
  if (code !== undefined) updatePayload.code = code;
  if (statusRaw !== undefined) {
    if (statusRaw === 'active' || statusRaw === 'inactive') {
      updatePayload.status = statusRaw;
    } else {
      return NextResponse.redirect(new URL("/admin/affiliates?error=invalid_status", req.url));
    }
  }
  if (visibilityRaw !== undefined) {
    if (visibilityRaw === 'basic' || visibilityRaw === 'enhanced') {
      updatePayload.visibility_level = visibilityRaw;
    } else {
      return NextResponse.redirect(new URL("/admin/affiliates?error=invalid_visibility", req.url));
    }
  }

  if (Object.keys(updatePayload).length === 0) {
    return NextResponse.redirect(new URL("/admin/affiliates?error=no_fields", req.url));
  }

  // Use a typed builder to align with Database Update type and avoid generic inference issues
  const updateBuilder = service.from('affiliates') as unknown as {
    update: (
      values: Database['public']['Tables']['affiliates']['Update']
    ) => {
      eq: (
        column: 'id',
        value: string
      ) => Promise<{ error: unknown }>
    }
  }
  const { error } = await updateBuilder.update(updatePayload).eq('id', id)
  if (error) {
    return NextResponse.redirect(new URL("/admin/affiliates?error=update_failed", req.url));
  }

  return NextResponse.redirect(new URL("/admin/affiliates?success=updated", req.url));
}