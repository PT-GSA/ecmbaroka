import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { SupabaseClient } from "@supabase/supabase-js";
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

  const service = createServiceClient() as SupabaseClient<Database>;
  const { error } = await service.from("affiliates").delete().eq("id", id);
  if (error) {
    return NextResponse.redirect(new URL("/admin/affiliates?error=delete_failed", req.url));
  }

  return NextResponse.redirect(new URL("/admin/affiliates?success=deleted", req.url));
}