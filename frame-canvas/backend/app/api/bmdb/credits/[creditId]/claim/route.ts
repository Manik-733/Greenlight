import { NextRequest, NextResponse } from "next/server";
import { createClientServer } from "@/lib/supabase/server";

interface ClaimRequest {
  // No body required, user is determined from Bearer token
}

export async function POST(
  request: NextRequest,
  { params }: { params: { creditId: string } }
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

    const creditId = params.creditId;

    // Fetch the credit to verify it exists and is unclaimed
    const { data: credit, error: creditError } = await supabase
      .from("credits")
      .select(
        "id, credited_name, credited_user_id, status, project_id, job_title"
      )
      .eq("id", creditId)
      .single();

    if (creditError || !credit) {
      return NextResponse.json({ error: "Credit not found" }, { status: 404 });
    }

    // Verify credit is unclaimed
    if (credit.status !== "UNCLAIMED") {
      return NextResponse.json(
        { error: "Credit is not unclaimed" },
        { status: 400 }
      );
    }

    // Verify credited_user_id is null
    if (credit.credited_user_id !== null) {
      return NextResponse.json(
        { error: "Credit is already claimed" },
        { status: 400 }
      );
    }

    // Fetch current user's display_name
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("display_name")
      .eq("id", user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    // Verify credited_name matches user's display_name (case-insensitive)
    if (
      !userData.display_name ||
      credit.credited_name.toLowerCase() !== userData.display_name.toLowerCase()
    ) {
      return NextResponse.json(
        {
          error:
            "Your display name does not match the credited name on this credit",
        },
        { status: 403 }
      );
    }

    // Update the credit: set credited_user_id and status to PENDING_ACCEPTANCE
    const { data: updatedCredit, error: updateError } = await supabase
      .from("credits")
      .update({
        credited_user_id: user.id,
        status: "PENDING_ACCEPTANCE",
        updated_at: new Date().toISOString(),
      })
      .eq("id", creditId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating credit:", updateError);
      return NextResponse.json(
        { error: "Failed to claim credit" },
        { status: 500 }
      );
    }

    const response = {
      id: updatedCredit.id,
      credited_name: updatedCredit.credited_name,
      credited_user_id: updatedCredit.credited_user_id,
      status: updatedCredit.status,
      job_title: updatedCredit.job_title,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error in POST /credits/:creditId/claim:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
