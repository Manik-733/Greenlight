import { NextRequest, NextResponse } from "next/server";
import { createClientServer } from "@/lib/supabase/server";

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
  created_at: string;
  verified_credits_count: number;
  projects_count: number;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } },
) {
  try {
    const username = params.username;

    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 },
      );
    }

    console.log("Fetching profile for username:", username);

    const supabase = createClientServer();

    // Fetch profile by username
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("user_id, username, display_name, bio, avatar_url, created_at")
      .eq("username", username)
      .single();

    console.log("Profile lookup result:", {
      username,
      found: !!profile,
      error: profileError?.message,
    });

    if (profileError || !profile) {
      console.error("Profile not found:", profileError);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Count verified credits for this user
    const { count: verifiedCreditsCount, error: creditsError } = await supabase
      .from("credits")
      .select("*", { count: "exact", head: true })
      .eq("credited_user_id", profile.user_id)
      .eq("status", "VERIFIED");

    if (creditsError) {
      console.error("Error counting verified credits:", creditsError);
    }

    // Count distinct published projects where user is OWNER
    const { data: ownedProjects, error: projectsError } = await supabase
      .from("project_memberships")
      .select("project_id")
      .eq("user_id", profile.user_id)
      .eq("role", "OWNER");

    if (projectsError) {
      console.error("Error fetching owned projects:", projectsError);
    }

    let projectsCount = 0;
    if (ownedProjects && ownedProjects.length > 0) {
      const projectIds = ownedProjects.map((p) => p.project_id);
      const { count } = await supabase
        .from("projects")
        .select("*", { count: "exact", head: true })
        .in("id", projectIds)
        .eq("status", "PUBLISHED");
      projectsCount = count || 0;
    }

    const response: ProfileResponse = {
      user_id: profile.user_id,
      username: profile.username,
      display_name: profile.display_name,
      bio: profile.bio,
      avatar_url: profile.avatar_url,
      created_at: profile.created_at,
      verified_credits_count: verifiedCreditsCount || 0,
      projects_count: projectsCount,
    };

    return NextResponse.json(response, { headers: corsHeaders });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: corsHeaders },
    );
  }
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS",
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization",
  );
  response.headers.set("Access-Control-Max-Age", "86400");
  return response;
}
