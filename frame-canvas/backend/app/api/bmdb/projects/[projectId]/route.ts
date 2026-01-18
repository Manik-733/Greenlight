import { NextRequest, NextResponse } from "next/server";
import { createClientServer } from "@/lib/supabase/server";

interface UpdateProjectRequest {
  title?: string;
  description?: string;
  poster_url?: string;
  project_type?: "SHORT" | "FEATURE" | "SERIES" | "STUDENT" | "OTHER";
  publish?: boolean;
}

interface ProjectResponse {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  poster_url: string | null;
  project_type: string;
  status: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
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
  projectId: string,
  supabase: ReturnType<typeof createClientServer>
): Promise<string> {
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const { data, error } = await supabase
      .from("projects")
      .select("id")
      .eq("slug", slug)
      .neq("id", projectId)
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
      throw error;
    }
  }
}

export async function PATCH(
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

    // Fetch current project
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      console.error("Project not found:", projectError);
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check if user is OWNER
    const { data: membership, error: membershipError } = await supabase
      .from("project_memberships")
      .select("role")
      .eq("project_id", projectId)
      .eq("user_id", user.id)
      .single();

    if (membershipError || !membership || membership.role !== "OWNER") {
      console.error("User is not project owner");
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse request body
    const body: UpdateProjectRequest = await request.json();

    // Build update object
    const updateData: any = {};

    // Update title and regenerate slug only if DRAFT
    if (body.title !== undefined && body.title.trim().length > 0) {
      updateData.title = body.title.trim();

      if (project.status === "DRAFT") {
        const baseSlug = generateSlug(body.title);
        const newSlug = await generateUniqueSlug(baseSlug, projectId, supabase);
        updateData.slug = newSlug;
      }
    }

    // Update description
    if (body.description !== undefined) {
      updateData.description = body.description || null;
    }

    // Update poster_url
    if (body.poster_url !== undefined) {
      updateData.poster_url = body.poster_url || null;
    }

    // Update project_type
    if (body.project_type !== undefined) {
      updateData.project_type = body.project_type;
    }

    // Handle publish/unpublish
    if (body.publish !== undefined) {
      if (body.publish) {
        // Validate title is non-empty before publishing
        const titleToPublish =
          updateData.title !== undefined ? updateData.title : project.title;
        if (!titleToPublish || titleToPublish.trim().length === 0) {
          return NextResponse.json(
            { error: "Project must have a title to publish" },
            { status: 400 }
          );
        }
        updateData.status = "PUBLISHED";
        updateData.published_at = new Date().toISOString();
      } else {
        updateData.status = "DRAFT";
        // Don't modify published_at when reverting to draft
      }
    }

    // Update timestamp
    updateData.updated_at = new Date().toISOString();

    // Update project
    const { data: updatedProject, error: updateError } = await supabase
      .from("projects")
      .update(updateData)
      .eq("id", projectId)
      .select("*")
      .single();

    if (updateError || !updatedProject) {
      console.error("Error updating project:", updateError);
      return NextResponse.json(
        { error: "Failed to update project" },
        { status: 500 }
      );
    }

    const response: ProjectResponse = {
      id: updatedProject.id,
      title: updatedProject.title,
      slug: updatedProject.slug,
      description: updatedProject.description,
      poster_url: updatedProject.poster_url,
      project_type: updatedProject.project_type,
      status: updatedProject.status,
      published_at: updatedProject.published_at,
      created_at: updatedProject.created_at,
      updated_at: updatedProject.updated_at,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in PATCH /projects/:projectId:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
