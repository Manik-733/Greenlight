import { NextRequest, NextResponse } from "next/server";
import { createClientServer } from "@/lib/supabase/server";

interface Credit {
  id: string;
  job_title: string;
  character_name: string | null;
  credited_name: string;
  status: string;
  created_at: string;
}

interface AllCreditsResponse {
  credits: Credit[];
}

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const supabase = createClientServer();

    // Get the user from the Bearer token
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projectId = params.projectId;

    // Fetch the project to verify ownership
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, created_by_user_id")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check authorization - owner or admin only
    if (project.created_by_user_id !== user.id) {
      // For now, we don't have an admin check, only owner can see all credits
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch ALL credits (all statuses) for this project
    const { data: credits, error: creditsError } = await supabase
      .from("credits")
      .select(
        "id, job_title, character_name, credited_name, status, created_at"
      )
      .eq("project_id", projectId)
      .order("job_title", { ascending: true })
      .order("created_at", { ascending: true });

    if (creditsError) {
      return NextResponse.json(
        { error: "Failed to fetch credits" },
        { status: 500 }
      );
    }

    const response: AllCreditsResponse = {
      credits: credits || [],
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error in GET /projects/:projectId/credits/all:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
