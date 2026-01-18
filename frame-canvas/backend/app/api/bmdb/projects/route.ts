import { NextRequest, NextResponse } from "next/server";
import { createClientServer } from "@/lib/supabase/server";

interface CreateProjectRequest {
  title: string;
  project_type?: "SHORT" | "FEATURE" | "SERIES" | "STUDENT";
  description?: string;
}

interface CreateProjectResponse {
  id: string;
  slug: string;
  status: string;
  title: string;
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 100);
}

async function generateUniqueSlug(
  baseSlug: string,
  supabase: ReturnType<typeof createClientServer>
): Promise<string> {
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const { data, error } = await supabase
      .from("projects")
      .select("id")
      .eq("slug", slug)
      .single();

    if (error && error.code === "PGRST116") {
      // No match found, slug is unique
      return slug;
    }

    if (data) {
      // Slug already exists, append counter
      slug = `${baseSlug}-${counter}`;
      counter++;
    } else if (error) {
      // Some other error occurred
      throw error;
    }
  }
}

export async function POST(request: NextRequest) {
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

    // Parse request body
    const body: CreateProjectRequest = await request.json();

    // Validate required fields
    if (!body.title || body.title.trim().length === 0) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const projectType = body.project_type || "SHORT";
    const baseSlug = generateSlug(body.title);
    const uniqueSlug = await generateUniqueSlug(baseSlug, supabase);

    // Create project
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .insert({
        title: body.title.trim(),
        slug: uniqueSlug,
        description: body.description || null,
        project_type: projectType,
        status: "DRAFT",
        created_by_user_id: user.id,
        published_at: null,
      })
      .select("id, title, slug, status")
      .single();

    if (projectError || !project) {
      console.error("Error creating project:", projectError);
      return NextResponse.json(
        { error: "Failed to create project" },
        { status: 500 }
      );
    }

    // Add creator as project owner in memberships
    // Wrapped in error handling to prevent orphaned projects without OWNER
    const { error: membershipError } = await supabase
      .from("project_memberships")
      .insert({
        project_id: project.id,
        user_id: user.id,
        role: "OWNER",
      });

    if (membershipError) {
      console.error("Error creating project membership:", membershipError);
      // Delete orphaned project if membership creation fails
      await supabase.from("projects").delete().eq("id", project.id);
      return NextResponse.json(
        { error: "Failed to create project" },
        { status: 500 }
      );
    }

    const response: CreateProjectResponse = {
      id: project.id,
      slug: project.slug,
      status: project.status,
      title: project.title,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Error in POST /projects:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
