/**
 * Browser-safe Supabase client singleton for VolunteerBridge frontend.
 * Utilizes public environment variables ONLY.
 */

import { createClient, User } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Ensure authenticated Supabase Auth user has a corresponding row in public.profiles.
 */
export async function syncUserProfile(user: User) {
  if (!user) return;
  try {
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (!existing) {
      // Resolve default organization UUID
      const { data: org } = await supabase
        .from("organizations")
        .select("id")
        .eq("slug", "default")
        .maybeSingle();

      await supabase.from("profiles").upsert({
        id: user.id,
        email: user.email || "",
        full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
        role: "USER",
        organization_id: org?.id || null,
        avatar_url: user.user_metadata?.avatar_url || null,
      });
    }
  } catch (err) {
    console.warn("Profile sync notice:", err);
  }
}
