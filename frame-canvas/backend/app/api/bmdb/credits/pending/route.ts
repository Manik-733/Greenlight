import { NextRequest, NextResponse } from "next/server";
import { createClientServer } from "@/lib/supabase/server";

interface PendingCredit {
  id: string;
  project_id: string;
  project_title: string;
  job_title: string;
  character_name: string | null;
  status: string;
  created_by_user_id: string;
  created_at: string;
  creator_name: string;
}

export async function GET(request: NextRequest) {
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

    // Fetch pending credits for current user
    const { data: credits, error: creditsError } = await supabase
      .from("credits")
      .select(
        `
        id,
        project_id,
        job_title,
        character_name,
        status,
        created_by_user_id,
        created_at,
        projects:project_id(title),
        created_by:created_by_user_id(display_name, username)
      `,
      )
      .eq("credited_user_id", user.id)
      .eq("status", "PENDING_ACCEPTANCE")
      .order("created_at", { ascending: false });

    if (creditsError) {
      console.error("Error fetching pending credits:", creditsError);
      return NextResponse.json(
        { error: "Failed to fetch pending credits" },
        { status: 500 },
      );
    }

    const formattedCredits: PendingCredit[] = (credits || []).map((credit) => {
      const creator = credit.created_by as any;
      const creatorName =
        creator?.display_name || creator?.username || "Unknown";
      return {
        id: credit.id,
        project_id: credit.project_id,
        project_title: (credit.projects as any)?.title || "Unknown Project",
        job_title: credit.job_title,
        character_name: credit.character_name,
        status: credit.status,
        created_by_user_id: credit.created_by_user_id,
        created_at: credit.created_at,
        creator_name: creatorName,
      };
    });

    return NextResponse.json({ credits: formattedCredits });
  } catch (error) {
    console.error("Error in GET /credits/pending:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
