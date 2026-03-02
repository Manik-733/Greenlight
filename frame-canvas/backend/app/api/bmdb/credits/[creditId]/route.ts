import { NextRequest, NextResponse } from "next/server";
import { createClientServer } from "@/lib/supabase/server";

interface UpdateCreditRequest {
  status?: "VERIFIED" | "REJECTED" | "REMOVED";
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
  verified_at: string | null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { creditId: string } },
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

    const creditId = params.creditId;

    // Fetch credit with project info
    const { data: credit, error: creditError } = await supabase
      .from("credits")
      .select(
        `
        id,
        project_id,
        credit_type,
        job_title,
        character_name,
        credited_name,
        credited_user_id,
        status,
        created_by_user_id,
        created_at,
        updated_at,
        verified_at,
        projects:project_id(id, created_by_user_id)
      `,
      )
      .eq("id", creditId)
      .single();

    if (creditError || !credit) {
      console.error("Credit not found:", creditError);
      return NextResponse.json({ error: "Credit not found" }, { status: 404 });
    }

    // Parse request body
    const body: UpdateCreditRequest = await request.json();

    // Reject if no status update provided
    if (!body.status) {
      return NextResponse.json(
        { error: "status is required for update" },
        { status: 400 },
      );
    }

    // Reject if status not valid
    if (!["VERIFIED", "REJECTED", "REMOVED"].includes(body.status)) {
      return NextResponse.json(
        { error: "status must be 'VERIFIED', 'REJECTED', or 'REMOVED'" },
        { status: 400 },
      );
    }

    // Define allowed status transitions (state machine)
    const allowedTransitions: Record<string, string[]> = {
      PENDING_ACCEPTANCE: ["VERIFIED", "REJECTED", "REMOVED"],
      UNCLAIMED: [],
      VERIFIED: [],
      REJECTED: [],
      REMOVED: [],
    };

    // Check if transition is allowed
    const currentStatus = credit.status as keyof typeof allowedTransitions;
    if (!allowedTransitions[currentStatus]?.includes(body.status)) {
      const allowed = allowedTransitions[currentStatus] || [];
      return NextResponse.json(
        {
          error: `Cannot transition from ${credit.status} to ${body.status}. Allowed transitions: ${allowed.length > 0 ? allowed.join(", ") : "none"}`,
        },
        { status: 400 },
      );
    }

    // Determine authorization based on action
    const isCredittedUser = user.id === credit.credited_user_id;
    const projectData = credit.projects as any;
    const isProjectOwner = user.id === projectData?.created_by_user_id;

    let isAuthorized = false;

    if (body.status === "VERIFIED" || body.status === "REJECTED") {
      // Only the credited user can accept/reject
      isAuthorized = isCredittedUser;
    } else if (body.status === "REMOVED") {
      // Only the project owner can remove
      isAuthorized = isProjectOwner;
    }

    if (!isAuthorized) {
      console.error("User not authorized to perform this action on credit", {
        userId: user.id,
        creditId: creditId,
        action: body.status,
      });
      return NextResponse.json(
        { error: "Forbidden - you cannot perform this action" },
        { status: 403 },
      );
    }

    // Build update object
    const updateData: any = {
      status: body.status,
      updated_at: new Date().toISOString(),
    };

    // Set verified_at only when status is VERIFIED
    if (body.status === "VERIFIED") {
      updateData.verified_at = new Date().toISOString();
    }

    // Update credit
    const { data: updatedCredit, error: updateError } = await supabase
      .from("credits")
      .update(updateData)
      .eq("id", creditId)
      .select("*")
      .single();

    if (updateError || !updatedCredit) {
      console.error("Error updating credit:", updateError);
      return NextResponse.json(
        { error: "Failed to update credit" },
        { status: 500 },
      );
    }

    const response: CreditResponse = {
      id: updatedCredit.id,
      project_id: updatedCredit.project_id,
      credit_type: updatedCredit.credit_type,
      job_title: updatedCredit.job_title,
      character_name: updatedCredit.character_name,
      credited_name: updatedCredit.credited_name,
      credited_user_id: updatedCredit.credited_user_id,
      status: updatedCredit.status,
      created_by_user_id: updatedCredit.created_by_user_id,
      created_at: updatedCredit.created_at,
      updated_at: updatedCredit.updated_at,
      verified_at: updatedCredit.verified_at,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in PATCH /credits/:creditId:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
