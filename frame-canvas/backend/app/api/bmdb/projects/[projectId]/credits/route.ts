import { NextRequest, NextResponse } from "next/server";
import { createClientServer } from "@/lib/supabase/server";

interface CreateCreditRequest {
  credit_type: "CAST" | "CREW";
  job_title: string;
  character_name?: string | null;
  credited_user_id?: string | null;
  credited_name?: string | null;
}

interface CreditResponse {
  id: string;
  project_id: string;
  credit_type: string;
  job_title: string;
  character_name: string | null;
  credited_name: string | null;
  credited_user_id: string | null;
  status: string;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const supabase = createClientServer();

    // Verify token and get user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error("Auth error:", authError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projectId = params.projectId;

    // Check if project exists
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      console.error("Project not found:", projectError);
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check if user is OWNER or ADMIN of the project
    const { data: membership, error: membershipError } = await supabase
      .from("project_memberships")
      .select("role")
      .eq("project_id", projectId)
      .eq("user_id", user.id)
      .single();

    if (
      membershipError ||
      !membership ||
      !["OWNER", "ADMIN"].includes(membership.role)
    ) {
      console.error("User is not project owner or admin");
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse request body
    const body: CreateCreditRequest = await request.json();

    // Validate credit_type
    if (!body.credit_type || !["CAST", "CREW"].includes(body.credit_type)) {
      return NextResponse.json(
        { error: "credit_type must be 'CAST' or 'CREW'" },
        { status: 400 }
      );
    }

    // Validate job_title
    if (!body.job_title || body.job_title.trim().length === 0) {
      return NextResponse.json(
        { error: "job_title is required" },
        { status: 400 }
      );
    }

    // Validate that either credited_user_id or credited_name is provided
    if (!body.credited_user_id && !body.credited_name) {
      return NextResponse.json(
        {
          error: "Either credited_user_id or credited_name must be provided",
        },
        { status: 400 }
      );
    }

    // Determine status based on credited_user_id
    const status = body.credited_user_id ? "PENDING_ACCEPTANCE" : "UNCLAIMED";

    // Insert credit
    const { data: credit, error: creditError } = await supabase
      .from("credits")
      .insert({
        project_id: projectId,
        credit_type: body.credit_type,
        job_title: body.job_title.trim(),
        character_name: body.character_name || null,
        credited_user_id: body.credited_user_id || null,
        credited_name: body.credited_name || null,
        status: status,
        created_by_user_id: user.id,
      })
      .select("*")
      .single();

    if (creditError || !credit) {
      console.error("Error creating credit:", creditError);

      // Handle unique constraint violations
      if (creditError?.code === "23505") {
        return NextResponse.json(
          { error: "This credit already exists for this project" },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: "Failed to create credit" },
        { status: 500 }
      );
    }

    const response: CreditResponse = {
      id: credit.id,
      project_id: credit.project_id,
      credit_type: credit.credit_type,
      job_title: credit.job_title,
      character_name: credit.character_name,
      credited_name: credit.credited_name,
      credited_user_id: credit.credited_user_id,
      status: credit.status,
      created_by_user_id: credit.created_by_user_id,
      created_at: credit.created_at,
      updated_at: credit.updated_at,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Error in POST /projects/:projectId/credits:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
