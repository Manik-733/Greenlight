import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Extract token from Authorization header (optional)
  const token = req.headers.get("authorization")?.split(" ")[1];
  let userId: string | null = null;

  if (token) {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (!authError && user) {
      userId = user.id;
    }
  }

  try {
    // Fetch project by slug
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("slug", params.slug)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check authorization for non-published projects
    if (project.status !== "PUBLISHED") {
      if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 404 });
      }

      const { data: membership, error: memberError } = await supabase
        .from("project_memberships")
        .select("*")
        .eq("project_id", project.id)
        .eq("user_id", userId)
        .eq("role", "OWNER")
        .single();

      if (memberError || !membership) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 404 });
      }
    }

    // Fetch owner profile
    const { data: owner, error: ownerError } = await supabase
      .from("profiles")
      .select("username, display_name")
      .eq("user_id", project.owner_id)
      .single();

    if (ownerError) {
      return NextResponse.json(
        { error: "Failed to fetch owner profile" },
        { status: 500 }
      );
    }

    // Fetch verified and unclaimed credits (unclaimed can be claimed by matching user)
    const { data: credits, error: creditsError } = await supabase
      .from("credits")
      .select(
        "id, job_title, character_name, credited_name, credited_user_id, status"
      )
      .eq("project_id", project.id)
      .in("status", ["VERIFIED", "UNCLAIMED"])
      .order("job_title", { ascending: true })
      .order("created_at", { ascending: true });

    if (creditsError) {
      return NextResponse.json(
        { error: "Failed to fetch credits" },
        { status: 500 }
      );
    }

    // Group credits by job_title for display
    const creditsByRole: Record<string, any[]> = {};
    credits?.forEach((credit) => {
      const role = credit.job_title;
      if (!creditsByRole[role]) {
        creditsByRole[role] = [];
      }
      creditsByRole[role].push({
        id: credit.id,
        name: credit.credited_name,
        character_name: credit.character_name,
        is_verified: credit.status === "VERIFIED", // Only VERIFIED credits show as verified
        status: credit.status, // Include status for unclaimed credits
      });
    });

    // Return project with owner and credits
    return NextResponse.json(
      {
        id: project.id,
        title: project.title,
        slug: project.slug,
        description: project.description,
        status: project.status,
        project_type: project.project_type,
        poster_url: project.poster_url,
        published_at: project.published_at,
        created_at: project.created_at,
        updated_at: project.updated_at,
        owner: owner,
        credits: creditsByRole,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
