import { NextRequest, NextResponse } from "next/server";
import { createClientServer } from "@/lib/supabase/server";

interface SearchResult {
  user_id: string;
  username: string;
  display_name: string;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ results: [] });
    }

    const supabase = createClientServer();

    // Search for users by username (case-insensitive prefix match)
    const { data: users, error } = await supabase
      .from("profiles")
      .select("user_id, username, display_name")
      .ilike("username", `${query.toLowerCase()}%`)
      .limit(10);

    if (error) {
      console.error("Search error:", error);
      return NextResponse.json({ results: [] });
    }

    const results: SearchResult[] = (users || []).map((user) => ({
      user_id: user.user_id,
      username: user.username,
      display_name: user.display_name,
    }));

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Error in GET /users/search:", error);
    return NextResponse.json({ results: [] });
  }
}
