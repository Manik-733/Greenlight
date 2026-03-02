import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { jwtDecode } from "jwt-decode";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface ProfileResponse {
  user_id: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  is_banned: boolean;
  banned_reason: string | null;
  created_at: string;
  updated_at: string;
}

interface MeResponse {
  profile: ProfileResponse | null;
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: corsHeaders },
      );
    }

    const token = authHeader.slice(7);

    // Decode the JWT to get the user ID
    const decoded = jwtDecode<{ sub: string }>(token);
    const userId = decoded.sub;

    if (!userId) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401, headers: corsHeaders },
      );
    }

    console.log("Token decoded, user_id:", userId);

    // Use service role client to fetch profile (bypasses RLS)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // Fetch profile by user_id
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    console.log("Profile fetch result:", {
      user_id: userId,
      found: !!profile,
      username: profile?.username,
      error: profileError?.message,
    });

    if (profileError) {
      console.error("Error fetching profile:", profileError);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500, headers: corsHeaders },
      );
    }

    // If profile doesn't exist, create one from auth user data
    if (!profile) {
      console.log(
        "Profile not found for user_id:",
        userId,
        "- auto-creating...",
      );

      // Get user from auth to get email
      const {
        data: { user: authUser },
        error: authError,
      } = await supabaseAdmin.auth.admin.getUserById(userId);

      if (authError || !authUser?.email) {
        console.log("Auth user not found or no email, returning null profile");
        return NextResponse.json(
          { profile: null },
          { status: 200, headers: corsHeaders },
        );
      }

      // Generate a default username from email
      const defaultUsername = authUser.email.split("@")[0];
      console.log("Auto-creating profile with username:", defaultUsername);

      const { data: newProfile, error: createError } = await supabaseAdmin
        .from("profiles")
        .insert({
          user_id: userId,
          username: defaultUsername,
          display_name: defaultUsername,
        })
        .select("*")
        .single();

      if (createError) {
        console.error("Error auto-creating profile:", createError);
        return NextResponse.json(
          { profile: null },
          { status: 200, headers: corsHeaders },
        );
      }

      console.log("Auto-created profile successfully:", {
        user_id: userId,
        username: newProfile?.username,
      });

      const response: MeResponse = {
        profile: newProfile || null,
      };

      return NextResponse.json(response, { headers: corsHeaders });
    }

    const response: MeResponse = {
      profile: profile || null,
    };

    return NextResponse.json(response, { headers: corsHeaders });
  } catch (error) {
    console.error("Error in /me endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: corsHeaders },
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}
